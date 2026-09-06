<?php

namespace App\Controllers;

use App\Models\User;

class AuthController
{

    public function login($data)
    {
        if (empty($data['username']) || empty($data['password'])) {
            return [
                'status' => 'error',
                'message' => 'Username and password are required.'
            ];
        }

        $userModel = new User();
        $user = $userModel->findByUsername($data['username']);

        if ($user && password_verify($data['password'], $user['password_hash'])) {
            return [
                'status' => 'success',
                'message' => 'Login successful!',
                'user' => [
                    'id' => $user['user_id'],
                    'username' => $user['username'],
                    'first_name' => $user['first_name'],
                    'last_name' => $user['last_name'],
                    'role' => $user['role_name']
                ]
            ];
        }

        return [
            'status' => 'error',
            'message' => 'Invalid username or password.'
        ];
    }
}
