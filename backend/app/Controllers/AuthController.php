<?php

namespace App\Controllers;

use App\Models\User;

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
            return [
                'status' => 'Error',
                'message' => 'Username and password are required.'
            ];
        }

        $user = $this->userModel->findByUsername($data['username']);

        if ($user && password_verify($data['password'], $user['password_hash'])) {
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
                ]
            ];
        }

        return [
            'status' => 'Error',
            'message' => 'Invalid username or password.'
        ];
    }
}
