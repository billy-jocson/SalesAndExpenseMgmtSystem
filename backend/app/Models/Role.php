<?php

namespace App\Models;

use mysqli;
use RuntimeException;
use Throwable;

class Role
{
    private $db;

    private const PROTECTED_ROLES = [
        'administrator',
        'cashier staff',
        'inventory staff',
        'supplier',
    ];

    private const GRANT_LOCKED_ROLES = ['administrator'];

    private const MODULE_TABLES = [
        'Sales' => ['sales', 'sales_items'],
        'Inventory' => ['store_products', 'supplier_products', 'product_batches', 'product_categories'],
        'Expenses' => ['expenses', 'expense_categories'],
        'Suppliers' => ['suppliers', 'postal_codes'],
        'Staff' => ['staffs', 'users', 'roles'],
    ];

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

    private function clearResults(): void
    {
        $counter = 0;
        while ($this->db->more_results() && $this->db->next_result()) {
            if ($result = $this->db->store_result()) {
                $result->free();
            }
            if (++$counter > 50) {
                break;
            }
        }
    }

    private function getDatabaseName(): string
    {
        $res = $this->db->query("SELECT DATABASE()");
        $row = $res ? $res->fetch_row() : null;
        return !empty($row[0]) ? $row[0] : 'inventory_system';
    }

    public function fetchRoles($search = '')
    {
        $searchParam = $search ?? '';
        $stmt = $this->db->prepare("CALL sp_roles_fetch_all(?)");
        $stmt->bind_param('s', $searchParam);
        $stmt->execute();
        $result = $stmt->get_result();
        $roles = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
        $this->clearResults();
        $stmt->close();

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

        try {
            $stmt = $this->db->prepare("CALL sp_roles_create(?, ?)");
            $stmt->bind_param('ss', $roleName, $description);
            $stmt->execute();
            $result = $stmt->get_result();
            $row = $result ? $result->fetch_assoc() : null;
            $this->clearResults();
            $stmt->close();

            if (!$row || empty($row['role_id'])) {
                throw new RuntimeException('Failed to create role record.');
            }

            $roleId = (int)$row['role_id'];
        } catch (Throwable $e) {
            $this->clearResults();
            throw new RuntimeException($e->getMessage());
        }

        try {
            $mysqlRole = $this->mysqlRoleName($roleId);
            $this->runStatement("CREATE ROLE IF NOT EXISTS '{$mysqlRole}'");
            $this->grantPermissions($mysqlRole, $permissions);
        } catch (Throwable $e) {
            $this->runStatement("DROP ROLE IF EXISTS '{$this->mysqlRoleName($roleId)}'");
            $cleanup = $this->db->prepare("DELETE FROM roles WHERE role_id = ?");
            $cleanup->bind_param('i', $roleId);
            $cleanup->execute();
            $cleanup->close();
            throw new RuntimeException('Failed to provision role privileges: ' . $e->getMessage());
        }

        return [
            'status' => 'Success',
            'message' => 'Role created successfully.',
            'role_id' => $roleId,
        ];
    }

    public function isUserAdministrator(int $userId): bool
    {
        if ($userId <= 0) {
            return false;
        }

        $stmt = $this->db->prepare("CALL sp_roles_is_admin(?)");
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result ? $result->fetch_assoc() : null;
        $this->clearResults();
        $stmt->close();

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

        try {
            $stmt = $this->db->prepare("CALL sp_roles_update(?, ?, ?)");
            $stmt->bind_param('iss', $roleId, $roleName, $description);
            $stmt->execute();
            $this->clearResults();
            $stmt->close();
        } catch (Throwable $e) {
            $this->clearResults();
            throw new RuntimeException($e->getMessage());
        }

        $isGrantLocked = in_array(strtolower($roleName), self::GRANT_LOCKED_ROLES, true);
        if ($isGrantLocked) {
            return ['status' => 'Success', 'message' => 'Role updated successfully.'];
        }

        $mysqlRole = $this->mysqlRoleName($roleId);
        $this->runStatement("REVOKE ALL PRIVILEGES, GRANT OPTION FROM '{$mysqlRole}'");
        $this->grantPermissions($mysqlRole, $permissions);

        return ['status' => 'Success', 'message' => 'Role updated successfully.'];
    }

    public function deleteRole($roleId)
    {
        $roleId = (int)$roleId;
        if ($roleId <= 0) {
            throw new RuntimeException('A valid role is required.');
        }

        try {
            $stmt = $this->db->prepare("CALL sp_roles_delete(?)");
            $stmt->bind_param('i', $roleId);
            $stmt->execute();
            $this->clearResults();
            $stmt->close();
        } catch (Throwable $e) {
            $this->clearResults();
            throw new RuntimeException($e->getMessage());
        }

        $this->runStatement("DROP ROLE IF EXISTS '{$this->mysqlRoleName($roleId)}'");

        return ['status' => 'Success', 'message' => 'Role deleted successfully.'];
    }

    private function mysqlRoleName(int $roleId): string
    {
        return "app_role_" . (int)$roleId;
    }

    private function grantPermissions(string $mysqlRole, array $permissions): void
    {
        $dbName = $this->getDatabaseName();

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
                    "GRANT {$privilegeList} ON `{$dbName}`.`{$table}` TO '{$mysqlRole}'"
                );
            }

            if ($module === 'Expenses' && in_array('Write', $actions, true)) {
                $this->runStatement(
                    "GRANT EXECUTE ON PROCEDURE `{$dbName}`.`sp_add_expense` TO '{$mysqlRole}'"
                );
            }
        }
    }

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

        try {
            $tableResult = $this->db->query(
                "SELECT User, Table_name, Table_priv
                 FROM mysql.tables_priv
                 WHERE User LIKE 'app\\_role\\_%'"
            );
            if ($tableResult) {
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
            }

            $procResult = $this->db->query(
                "SELECT User, Routine_name, Proc_priv
                 FROM mysql.procs_priv
                 WHERE User LIKE 'app\\_role\\_%' AND Routine_name = 'sp_add_expense'"
            );
            if ($procResult) {
                while ($row = $procResult->fetch_assoc()) {
                    $roleId = $this->roleIdFromMysqlName($row['User']);
                    if ($roleId === null || stripos($row['Proc_priv'], 'Execute') === false) {
                        continue;
                    }
                    $grants[$roleId] ??= array_fill_keys(array_keys(self::MODULE_TABLES), []);
                    $grants[$roleId]['Expenses'][] = 'Write';
                }
            }
        } catch (Throwable $e) {
            // Hindi ika-crash ang app kung walang direct read permission sa mysql.tables_priv
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

    private function runStatement(string $sql): void
    {
        if (!$this->db->query($sql)) {
            throw new RuntimeException("Database statement failed: {$this->db->error}");
        }
    }

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
