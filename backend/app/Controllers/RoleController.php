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

    /**
     * Role Manager is administrator-only. This app doesn't use PHP
     * sessions anywhere, so -- same pattern as POSController::checkout --
     * the frontend sends user_id with every request, and this looks up
     * that user's actual role_name in the database rather than trusting
     * anything the client claims about its own role.
     */
    private function requireAdmin($data)
    {
        $userId = (int) ($data['user_id'] ?? 0);
        if (!$this->roleModel->isUserAdministrator($userId)) {
            throw new RuntimeException('Forbidden: administrators only.');
        }
    }

    public function getRoles($data = [])
    {
        try {
            $this->requireAdmin($data);
            return [
                'status' => 'Success',
                'data' => $this->roleModel->fetchRoles(),
            ];
        } catch (\Throwable $e) {
            return ['status' => 'Error', 'message' => $e->getMessage()];
        }
    }

    public function addRole($data = [])
    {
        try {
            $this->requireAdmin($data);
            return $this->roleModel->addRole($data);
        } catch (\Throwable $e) {
            return ['status' => 'Error', 'message' => $e->getMessage()];
        }
    }

    public function updateRole($data = [])
    {
        try {
            $this->requireAdmin($data);
            return $this->roleModel->updateRole($data);
        } catch (\Throwable $e) {
            return ['status' => 'Error', 'message' => $e->getMessage()];
        }
    }

    public function deleteRole($data = [])
    {
        try {
            $this->requireAdmin($data);
            return $this->roleModel->deleteRole((int) ($data['role_id'] ?? 0));
        } catch (\Throwable $e) {
            return ['status' => 'Error', 'message' => $e->getMessage()];
        }
    }
}