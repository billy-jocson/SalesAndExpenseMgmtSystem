<?php

namespace App\Models;

use mysqli;
use RuntimeException;
use Throwable;

class Role
{
    private $db;

    public function __construct(mysqli $db = null)
    {
        $this->db = $db ?? (new Database())->getConnection();
    }

    private function clearResults(): void
    {
        while ($this->db->more_results() && $this->db->next_result()) {
            if ($result = $this->db->store_result()) {
                $result->free();
            }
        }
    }

    public function fetchPermissions(): array
    {
        $result = $this->db->query('CALL sp_permissions_fetch_all()');
        $permissions = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
        $this->clearResults();

        foreach ($permissions as &$permission) {
            $permission['permission_id'] = (int) $permission['permission_id'];
        }
        unset($permission);

        return $permissions;
    }

    public function fetchRolePermissions(int $roleId): array
    {
        $stmt = $this->db->prepare('CALL sp_roles_fetch_permissions(?)');
        $stmt->bind_param('i', $roleId);
        $stmt->execute();
        $result = $stmt->get_result();
        $permissions = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
        $this->clearResults();
        $stmt->close();

        foreach ($permissions as &$permission) {
            $permission['permission_id'] = (int) $permission['permission_id'];
        }
        unset($permission);

        return $permissions;
    }

    public function fetchRoles($search = ''): array
    {
        $search = (string) ($search ?? '');
        $stmt = $this->db->prepare('CALL sp_roles_fetch_all(?)');
        $stmt->bind_param('s', $search);
        $stmt->execute();
        $result = $stmt->get_result();
        $rows = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
        $this->clearResults();
        $stmt->close();

        $roles = [];
        foreach ($rows as $row) {
            $roleId = (int) $row['role_id'];
            if (!isset($roles[$roleId])) {
                $roles[$roleId] = [
                    'role_id' => $roleId,
                    'role_name' => $row['role_name'],
                    'description' => $row['description'],
                    'user_count' => (int) $row['user_count'],
                    'permissions' => [],
                    'permission_ids' => [],
                ];
            }

            if ($row['permission_id'] !== null) {
                $permissionId = (int) $row['permission_id'];
                $roles[$roleId]['permissions'][] = [
                    'permission_id' => $permissionId,
                    'permission_name' => $row['permission_name'],
                    'module' => $row['module'],
                    'description' => $row['permission_description'],
                ];
                $roles[$roleId]['permission_ids'][] = $permissionId;
            }
        }

        return array_values($roles);
    }

    public function addRole(array $data): array
    {
        return $this->saveRole(null, $data);
    }

    public function updateRole(array $data): array
    {
        $roleId = (int) ($data['role_id'] ?? 0);
        if ($roleId <= 0) {
            throw new RuntimeException('A valid role is required.');
        }

        return $this->saveRole($roleId, $data);
    }

    private function saveRole(?int $roleId, array $data): array
    {
        $isCreate = $roleId === null;
        $name = trim((string) ($data['role_name'] ?? ''));
        $description = trim((string) ($data['description'] ?? ''));
        $permissionIds = $this->permissionIdsToCsv($data['permission_ids'] ?? []);

        if ($name === '' || strlen($name) > 50) {
            throw new RuntimeException('Role name must be between 1 and 50 characters.');
        }

        $this->db->begin_transaction();
        try {
            if ($roleId === null) {
                $stmt = $this->db->prepare('CALL sp_roles_create(?, ?)');
                $stmt->bind_param('ss', $name, $description);
                $stmt->execute();
                $row = $stmt->get_result()->fetch_assoc();
                $roleId = (int) ($row['role_id'] ?? 0);
                $this->clearResults();
                $stmt->close();

                if ($roleId <= 0) {
                    throw new RuntimeException('Failed to create role.');
                }
            } else {
                $stmt = $this->db->prepare('CALL sp_roles_update(?, ?, ?)');
                $stmt->bind_param('iss', $roleId, $name, $description);
                $stmt->execute();
                $this->clearResults();
                $stmt->close();
            }

            $stmt = $this->db->prepare('CALL sp_roles_replace_permissions(?, ?)');
            $stmt->bind_param('is', $roleId, $permissionIds);
            $stmt->execute();
            $this->clearResults();
            $stmt->close();
            $this->db->commit();
        } catch (Throwable $error) {
            $this->db->rollback();
            $this->clearResults();
            throw new RuntimeException($error->getMessage());
        }

        return [
            'status' => 'Success',
            'message' => $isCreate
                ? 'Role created successfully.'
                : 'Role updated successfully.',
            'role_id' => $roleId,
        ];
    }

    public function isUserAdministrator(int $userId): bool
    {
        if ($userId <= 0) {
            return false;
        }

        $stmt = $this->db->prepare('CALL sp_roles_is_admin(?)');
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result ? $result->fetch_assoc() : null;
        $this->clearResults();
        $stmt->close();

        return (bool) ($row['is_admin'] ?? false);
    }

    public function userHasPermission(int $userId, string $permissionName): bool
    {
        $stmt = $this->db->prepare(
            'SELECT EXISTS (
                SELECT 1
                FROM users u
                INNER JOIN roles r ON r.role_id = u.role_id
                INNER JOIN role_permissions rp ON rp.role_id = r.role_id
                INNER JOIN permissions p ON p.permission_id = rp.permission_id
                WHERE u.user_id = ?
                  AND u.is_active = 1
                  AND r.is_active = 1
                  AND p.permission_name = ?
            ) AS has_permission'
        );
        $stmt->bind_param('is', $userId, $permissionName);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        return (bool) ($row['has_permission'] ?? false);
    }

    public function deleteRole($roleId, $currentUserId = 0): array
    {
        $roleId = (int) $roleId;
        $currentUserId = (int) $currentUserId;
        if ($roleId <= 0) {
            throw new RuntimeException('A valid role is required.');
        }

        $stmt = $this->db->prepare('CALL sp_roles_delete(?, ?)');
        $stmt->bind_param('ii', $roleId, $currentUserId);
        $stmt->execute();
        $this->clearResults();
        $stmt->close();

        return ['status' => 'Success', 'message' => 'Role deleted successfully.'];
    }

    private function permissionIdsToCsv($permissionIds): string
    {
        if (!is_array($permissionIds)) {
            throw new RuntimeException('Permission IDs must be an array.');
        }

        $ids = [];
        foreach ($permissionIds as $id) {
            $id = filter_var($id, FILTER_VALIDATE_INT);
            if ($id === false || $id <= 0) {
                throw new RuntimeException('A valid permission ID is required.');
            }
            $ids[] = $id;
        }

        return implode(',', array_unique($ids));
    }
}
