<?php

namespace App\Models;

use mysqli;
use RuntimeException;
use Throwable;

/**
 * Manages application roles AND the real MySQL ROLE object that backs
 * each one. The `roles` table only ever stores role_id/role_name/
 * description (see inventory_system.sql) -- no permissions column, since
 * a Module -> [Actions] matrix stuffed into one column would be a
 * multi-valued attribute in a single cell, which breaks 1NF. Instead, the
 * actual privileges live where a relational database already keeps them:
 * as GRANTs on a MySQL ROLE, one per application role, named
 * `app_role_{role_id}`. Role Manager's checkbox grid reads and writes
 * those GRANTs directly.
 */
class Role
{
    private $db;

    // Role names seeded by inventory_system.sql. Their exact role_name
    // string is relied on elsewhere in the app:
    //   - frontend ROLE_PERMISSIONS (UserContext.jsx) keys routes by these
    //     names, lowercased
    //   - Supplier::getSupplierRoleId() hardcodes a lookup for 'supplier'
    //   - Staff::getRoles() filters out 'supplier' from the staff dropdown
    // Renaming any of these would silently break those, so it's blocked.
    private const PROTECTED_ROLES = [
        'administrator',
        'cashier staff',
        'inventory staff',
        'supplier',
    ];

    // Administrator is additionally locked against permission edits, not
    // just renaming -- it's meant to stay ALL PRIVILEGES (matches the "*"
    // wildcard ROLE_PERMISSIONS already gives it on the frontend). Letting
    // someone uncheck a box here would leave the UI still showing every
    // admin page while the underlying queries start failing with "access
    // denied", which is a confusing way to lock yourself out.
    private const GRANT_LOCKED_ROLES = ['administrator'];

    // Role Manager's checkbox grid: which tables each Module covers.
    private const MODULE_TABLES = [
        'Sales' => ['sales', 'sales_items'],
        'Inventory' => ['store_products', 'supplier_products', 'product_batches', 'product_categories'],
        'Expenses' => ['expenses', 'expense_categories'],
        'Suppliers' => ['suppliers', 'postal_codes'],
        'Staff' => ['staffs', 'users', 'roles'],
    ];

    // Action -> the SQL privilege it grants.
    private const ACTION_PRIVILEGE = [
        'Read' => 'SELECT',
        'Write' => 'INSERT',
        'Update' => 'UPDATE',
        'Delete' => 'DELETE',
    ];

    public function __construct(mysqli $db = null)
    {
        $this->db = $db ?? (new Database())->getConnection();
    }

    /**
     * Every role, with its live MySQL grants read back and translated into
     * the same Module -> [Actions] shape the checkbox grid uses, plus how
     * many user accounts currently use it (so the UI can grey out Delete
     * instead of letting it fail after the fact).
     */
    public function fetchRoles($search = '')
    {
        $searchTerm = "%{$search}%";
        $stmt = $this->db->prepare(
            "SELECT r.role_id, r.role_name, r.description,
                    COUNT(u.user_id) AS user_count
             FROM roles r
             LEFT JOIN users u ON u.role_id = r.role_id
             WHERE r.role_name LIKE ? OR r.description LIKE ?
             GROUP BY r.role_id, r.role_name, r.description
             ORDER BY r.role_name ASC"
        );
        $stmt->bind_param('ss', $searchTerm, $searchTerm);
        $stmt->execute();
        $roles = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        $grantsByRoleId = $this->fetchAllRoleGrants();

        foreach ($roles as &$role) {
            $roleId = (int) $role['role_id'];
            $role['user_count'] = (int) $role['user_count'];
            $role['is_protected'] = in_array(
                strtolower(trim($role['role_name'])),
                self::PROTECTED_ROLES,
                true
            );
            $role['is_grant_locked'] = in_array(
                strtolower(trim($role['role_name'])),
                self::GRANT_LOCKED_ROLES,
                true
            );

            if ($role['is_grant_locked']) {
                // Administrator's real grant is schema-level (GRANT ALL
                // PRIVILEGES ON inventory_system.*), which MySQL stores in
                // mysql.db, not mysql.tables_priv -- the per-table
                // reverse-lookup below can't see it. Show every box
                // checked directly instead, since that's what it means.
                $role['permissions'] = array_map(
                    fn() => array_keys(self::ACTION_PRIVILEGE),
                    self::MODULE_TABLES
                );
                continue;
            }

            $role['permissions'] = $grantsByRoleId[$roleId] ?? array_fill_keys(array_keys(self::MODULE_TABLES), []);
        }
        unset($role);

        return $roles;
    }



    public function addRole($data = [])
    {
        $roleName = trim((string) ($data['role_name'] ?? ''));
        $description = trim((string) ($data['description'] ?? ''));
        $permissions = $this->normalizePermissions($data['permissions'] ?? []);

        if ($roleName === '') {
            throw new RuntimeException('Role name is required.');
        }
        if (strlen($roleName) > 50) {
            throw new RuntimeException('Role name must be 50 characters or fewer.');
        }

        $check = $this->db->prepare("SELECT role_id FROM roles WHERE LOWER(role_name) = LOWER(?) LIMIT 1");
        $check->bind_param('s', $roleName);
        $check->execute();
        if ($check->get_result()->num_rows > 0) {
            throw new RuntimeException('A role with this name already exists.');
        }

        $stmt = $this->db->prepare("INSERT INTO roles (role_name, description) VALUES (?, ?)");
        $stmt->bind_param('ss', $roleName, $description);
        $stmt->execute();
        $roleId = $this->db->insert_id;

        // CREATE ROLE / GRANT are DDL and DCL statements -- MySQL commits
        // these immediately and they can't be wrapped in the same
        // transaction as the INSERT above. If provisioning the MySQL role
        // fails partway, undo the INSERT and any partial grants by hand
        // so we don't leave an app-level role with no matching privileges.
        try {
            $mysqlRole = $this->mysqlRoleName($roleId);
            $this->runStatement("CREATE ROLE IF NOT EXISTS '{$mysqlRole}'");
            $this->grantPermissions($mysqlRole, $permissions);
        } catch (Throwable $e) {
            $this->runStatement("DROP ROLE IF EXISTS '{$this->mysqlRoleName($roleId)}'");
            $cleanup = $this->db->prepare("DELETE FROM roles WHERE role_id = ?");
            $cleanup->bind_param('i', $roleId);
            $cleanup->execute();
            throw new RuntimeException('Failed to provision role privileges: ' . $e->getMessage());
        }

        return [
            'status' => 'Success',
            'message' => 'Role created successfully.',
            'role_id' => $roleId,
        ];
    }

    /**
     * Checks if a given user ID belongs to the Administrator role.
     */
    public function isUserAdministrator(int $userId): bool
    {
        if ($userId <= 0) {
            return false;
        }

        $stmt = $this->db->prepare(
            "SELECT r.role_name 
             FROM users u 
             INNER JOIN roles r ON u.role_id = r.role_id 
             WHERE u.user_id = ? 
             LIMIT 1"
        );
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        $user = $stmt->get_result()->fetch_assoc();

        if ($user) {
            return strtolower(trim($user['role_name'])) === 'administrator';
        }

        return false;
    }

    public function updateRole($data = [])
    {
        $roleId = (int) ($data['role_id'] ?? 0);
        $roleName = trim((string) ($data['role_name'] ?? ''));
        $description = trim((string) ($data['description'] ?? ''));
        $permissions = $this->normalizePermissions($data['permissions'] ?? []);

        if ($roleId <= 0 || $roleName === '') {
            throw new RuntimeException('A valid role and name are required.');
        }

        $currentStmt = $this->db->prepare("SELECT role_name FROM roles WHERE role_id = ? LIMIT 1");
        $currentStmt->bind_param('i', $roleId);
        $currentStmt->execute();
        $current = $currentStmt->get_result()->fetch_assoc();

        if (!$current) {
            throw new RuntimeException('Role not found.');
        }

        $currentNameLower = strtolower(trim($current['role_name']));
        $isProtected = in_array($currentNameLower, self::PROTECTED_ROLES, true);
        $isGrantLocked = in_array($currentNameLower, self::GRANT_LOCKED_ROLES, true);

        if ($isProtected && strtolower($roleName) !== $currentNameLower) {
            $editable = $isGrantLocked ? 'its description' : 'its description and permissions';
            throw new RuntimeException(
                "This role's name is used elsewhere in the system (login, permissions) and can't be changed. You can still edit {$editable}."
            );
        }

        if (!$isProtected) {
            $dupStmt = $this->db->prepare(
                "SELECT role_id FROM roles WHERE LOWER(role_name) = LOWER(?) AND role_id != ? LIMIT 1"
            );
            $dupStmt->bind_param('si', $roleName, $roleId);
            $dupStmt->execute();
            if ($dupStmt->get_result()->num_rows > 0) {
                throw new RuntimeException('A role with this name already exists.');
            }
        }

        $updateStmt = $this->db->prepare("UPDATE roles SET role_name = ?, description = ? WHERE role_id = ?");
        $updateStmt->bind_param('ssi', $roleName, $description, $roleId);
        $updateStmt->execute();

        if ($isGrantLocked) {
            // Administrator keeps ALL PRIVILEGES regardless of what the
            // checkboxes say -- silently ignored rather than erroring, so
            // editing its description doesn't get blocked by this too.
            return ['status' => 'Success', 'message' => 'Role updated successfully.'];
        }

        // Full resync: clear every grant this role currently has, then
        // re-grant exactly what's checked now. Simpler and less
        // error-prone than diffing old vs. new permission state.
        $mysqlRole = $this->mysqlRoleName($roleId);
        $this->runStatement("REVOKE ALL PRIVILEGES, GRANT OPTION FROM '{$mysqlRole}'");
        $this->grantPermissions($mysqlRole, $permissions);

        return ['status' => 'Success', 'message' => 'Role updated successfully.'];
    }

    public function deleteRole($roleId)
    {
        $roleId = (int) $roleId;
        if ($roleId <= 0) {
            throw new RuntimeException('A valid role is required.');
        }

        $roleStmt = $this->db->prepare("SELECT role_name FROM roles WHERE role_id = ? LIMIT 1");
        $roleStmt->bind_param('i', $roleId);
        $roleStmt->execute();
        $role = $roleStmt->get_result()->fetch_assoc();

        if (!$role) {
            throw new RuntimeException('Role not found.');
        }

        if (in_array(strtolower(trim($role['role_name'])), self::PROTECTED_ROLES, true)) {
            throw new RuntimeException('This role is used by the system and cannot be deleted.');
        }

        // users.role_id -> roles.role_id is ON DELETE CASCADE, so deleting
        // a role that's still assigned to user accounts would silently
        // delete those accounts too. Block it instead.
        $countStmt = $this->db->prepare("SELECT COUNT(*) AS total FROM users WHERE role_id = ?");
        $countStmt->bind_param('i', $roleId);
        $countStmt->execute();
        $count = (int) $countStmt->get_result()->fetch_assoc()['total'];

        if ($count > 0) {
            throw new RuntimeException(
                "Cannot delete: {$count} user account(s) still use this role. Reassign or remove them first."
            );
        }

        // DROP ROLE first (IF EXISTS makes this safe even if the MySQL
        // role was somehow already gone), then remove the app-level row.
        $this->runStatement("DROP ROLE IF EXISTS '{$this->mysqlRoleName($roleId)}'");

        $deleteStmt = $this->db->prepare("DELETE FROM roles WHERE role_id = ?");
        $deleteStmt->bind_param('i', $roleId);
        $deleteStmt->execute();

        return ['status' => 'Success', 'message' => 'Role deleted successfully.'];
    }

    /**
     * The MySQL ROLE name for a given app role_id. Always built from an
     * integer primary key that's already validated server-side -- never
     * from client-supplied text -- so this can't be used to inject
     * anything into the GRANT/REVOKE/CREATE ROLE statements below.
     */
    private function mysqlRoleName(int $roleId): string
    {
        return "app_role_{$roleId}";
    }

    /**
     * Issues one GRANT per table for every checked action, plus the
     * EXECUTE grant on sp_add_expense when Expenses:Write is checked
     * (the dashboard's "Add Expense" calls that stored procedure).
     * Only module names in MODULE_TABLES and action names in
     * ACTION_PRIVILEGE are ever accepted -- anything else throws instead
     * of being interpolated into SQL.
     */
    private function grantPermissions(string $mysqlRole, array $permissions): void
    {
        foreach ($permissions as $module => $actions) {
            if (!array_key_exists($module, self::MODULE_TABLES)) {
                throw new RuntimeException("Unknown permission module: {$module}");
            }
            if (empty($actions)) {
                continue;
            }

            $privileges = [];
            foreach ($actions as $action) {
                if (!array_key_exists($action, self::ACTION_PRIVILEGE)) {
                    throw new RuntimeException("Unknown permission action: {$action}");
                }
                $privileges[] = self::ACTION_PRIVILEGE[$action];
            }
            $privilegeList = implode(', ', array_unique($privileges));

            foreach (self::MODULE_TABLES[$module] as $table) {
                $this->runStatement(
                    "GRANT {$privilegeList} ON `inventory_system`.`{$table}` TO '{$mysqlRole}'"
                );
            }

            if ($module === 'Expenses' && in_array('Write', $actions, true)) {
                $this->runStatement(
                    "GRANT EXECUTE ON PROCEDURE `inventory_system`.`sp_add_expense` TO '{$mysqlRole}'"
                );
            }
        }
    }

    /**
     * Reads mysql.tables_priv and mysql.procs_priv for every app_role_*
     * role in one pair of queries (rather than one query per role), and
     * translates the raw table/privilege grants back into the same
     * Module -> [Actions] shape the frontend checkbox grid uses.
     *
     * @return array<int, array<string, string[]>> keyed by role_id
     */
    private function fetchAllRoleGrants(): array
    {
        $tableToModule = [];
        foreach (self::MODULE_TABLES as $module => $tables) {
            foreach ($tables as $table) {
                $tableToModule[$table] = $module;
            }
        }
        $privilegeToAction = array_flip(self::ACTION_PRIVILEGE);

        $grants = [];

        $tableResult = $this->db->query(
            "SELECT User, Table_name, Table_priv
             FROM mysql.tables_priv
             WHERE User LIKE 'app\\_role\\_%'"
        );
        while ($row = $tableResult->fetch_assoc()) {
            $roleId = $this->roleIdFromMysqlName($row['User']);
            $module = $tableToModule[$row['Table_name']] ?? null;
            if ($roleId === null || $module === null) {
                continue;
            }

            $grants[$roleId] ??= array_fill_keys(array_keys(self::MODULE_TABLES), []);
            foreach (explode(',', $row['Table_priv']) as $priv) {
                $action = $privilegeToAction[strtoupper(trim($priv))] ?? null;
                if ($action !== null) {
                    $grants[$roleId][$module][] = $action;
                }
            }
        }

        $procResult = $this->db->query(
            "SELECT User, Routine_name, Proc_priv
             FROM mysql.procs_priv
             WHERE User LIKE 'app\\_role\\_%' AND Routine_name = 'sp_add_expense'"
        );
        while ($row = $procResult->fetch_assoc()) {
            $roleId = $this->roleIdFromMysqlName($row['User']);
            if ($roleId === null || stripos($row['Proc_priv'], 'Execute') === false) {
                continue;
            }
            $grants[$roleId] ??= array_fill_keys(array_keys(self::MODULE_TABLES), []);
            $grants[$roleId]['Expenses'][] = 'Write';
        }

        foreach ($grants as &$modules) {
            foreach ($modules as &$actions) {
                $actions = array_values(array_unique($actions));
            }
            unset($actions);
        }
        unset($modules);

        return $grants;
    }

    private function roleIdFromMysqlName(string $mysqlRoleName): ?int
    {
        if (preg_match('/^app_role_(\d+)$/', $mysqlRoleName, $matches)) {
            return (int) $matches[1];
        }
        return null;
    }

    /**
     * Runs a DDL/DCL statement (CREATE ROLE, GRANT, REVOKE, DROP ROLE).
     * These don't support placeholders/bind_param -- every value that
     * reaches here is either a server-generated identifier
     * (mysqlRoleName()) or a privilege keyword from ACTION_PRIVILEGE
     * above, never raw client input. Throws on failure whether or not
     * this PHP install has mysqli's exception mode on by default.
     */
    private function runStatement(string $sql): void
    {
        if (!$this->db->query($sql)) {
            throw new RuntimeException("Database statement failed: {$this->db->error}");
        }
    }

    /**
     * Keeps the incoming permissions payload predictable: an object of
     * module => [action, action, ...], values coerced to string arrays.
     * Actual validation against MODULE_TABLES/ACTION_PRIVILEGE happens in
     * grantPermissions() -- this just shapes the data.
     */
    private function normalizePermissions($permissions): array
    {
        if (!is_array($permissions)) {
            return [];
        }

        $normalized = [];
        foreach ($permissions as $module => $actions) {
            if (!is_array($actions)) {
                continue;
            }
            $normalized[$module] = array_values(array_unique(array_map('strval', $actions)));
        }

        return $normalized;
    }
}
