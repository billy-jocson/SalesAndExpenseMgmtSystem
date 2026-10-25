<?php

namespace App\Controllers;

use App\Models\Role;

use RuntimeException;

class RoleController
{
    private $roleModel;

    public function __construct()
    {
        $this->roleModel = new Role();
    }

    private function requirePermission($data, string $permission)
    {
        $userId = (int) ($data['user_id'] ?? 0);
        if (!$this->roleModel->userHasPermission($userId, $permission)) {
            throw new RuntimeException('Forbidden: missing permission ' . $permission . '.');
        }
    }

    public function getRoles($data = [])
    {
        try {
            $this->requirePermission($data, 'read_staffs');
            return [
                'status' => 'Success',
                'data' => $this->roleModel->fetchRoles(),
                'permissions' => $this->roleModel->fetchPermissions(),
            ];
        } catch (\Throwable $e) {
            return ['status' => 'Error', 'message' => $e->getMessage()];
        }
    }

    public function addRole($data = [])
    {
        try {
            $this->requirePermission($data, 'write_staffs');
            return $this->roleModel->addRole($data);
        } catch (\Throwable $e) {
            return ['status' => 'Error', 'message' => $e->getMessage()];
        }
    }

    public function updateRole($data = [])
    {
        try {
            $this->requirePermission($data, 'update_staffs');
            return $this->roleModel->updateRole($data);
        } catch (\Throwable $e) {
            return ['status' => 'Error', 'message' => $e->getMessage()];
        }
    }

    public function deleteRole($data = [])
    {
        try {
            $this->requirePermission($data, 'delete_staffs');
            return $this->roleModel->deleteRole(
                (int) ($data['role_id'] ?? 0),
                (int) ($data['user_id'] ?? 0)
            );
        } catch (\Throwable $e) {
            return ['status' => 'Error', 'message' => $e->getMessage()];
        }
    }
}
