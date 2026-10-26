<?php

namespace App\Controllers;

use App\Models\User;
use App\Models\Role;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

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
            $roleModel = new Role();
            $userPermissions = $roleModel->fetchRolePermissions(
                (int) $user['role_id']
            );

            // The token is stored in a cookie (~4 KB limit), so keep only the
            // fields the frontend needs. With every permission the full rows
            // (including descriptions) exceed the limit and the browser would
            // silently drop the cookie.
            $userPermissions = array_map(
                fn(array $permission) => [
                    'permission_id' => $permission['permission_id'],
                    'permission_name' => $permission['permission_name'],
                    'module' => $permission['module'],
                ],
                $userPermissions
            );

            $dotenv = \Dotenv\Dotenv::createImmutable(dirname(__DIR__, 3));
            $dotenv->load();

            $payload = [
                'id' => $user['user_id'],
                'username' => $user['username'],
                'first_name' => $user['first_name'],
                'last_name' => $user['last_name'],
                'role' => $user['role_name'],
                'supplier_id' => $user['supplier_id'] ?? null,
                'supplier_name' => $user['supplier_name'] ?? null,
                'permissions' => $userPermissions,
            ];
            $key = $_ENV['SECRET_KEY'];
            $token = JWT::encode($payload, $key, 'HS256');

            return [
                'status' => 'Success',
                'message' => 'Login successful!',
                'user' => $token
            ];
        }

        return ['status' => 'Error', 'message' => 'Invalid username or password.'];
    }
}