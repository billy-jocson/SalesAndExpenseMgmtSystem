<?php

namespace App\Controllers;

use App\Models\User;
use App\Models\Role; // I-import ang Role model

class AuthController
{
    private $userModel;

    public function __construct()
    {
        $this->userModel = new User();
    }

    public function login($data)
    {
        if (empty($data['username']) || empty($data['password'])) {
            return ['status' => 'Error', 'message' => 'Username and password are required.'];
        }

        $user = $this->userModel->findByUsername($data['username']);

        if ($user && password_verify($data['password'], $user['password_hash'])) {

            // Kukunin ang permissions dynamically galing sa MySQL Grants
            $roleModel = new Role();
            $allRoles = $roleModel->fetchRoles();
            $userPermissions = [];

            foreach ($allRoles as $r) {
                if ($r['role_id'] == $user['role_id']) {
                    $userPermissions = $r['permissions'] ?? [];
                    break;
                }
            }

            return [
                'status' => 'Success',
                'message' => 'Login successful!',
                'user' => [
                    'id' => $user['user_id'],
                    'username' => $user['username'],
                    'first_name' => $user['first_name'],
                    'last_name' => $user['last_name'],
                    'role' => $user['role_name'],
                    'supplier_id' => $user['supplier_id'] ?? null,
                    'supplier_name' => $user['supplier_name'] ?? null,
                    'permissions' => $userPermissions, // Ipapasa sa ContextProvider ng React
                ]
            ];
        }

        return ['status' => 'Error', 'message' => 'Invalid username or password.'];
    }
}
