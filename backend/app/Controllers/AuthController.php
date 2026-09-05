<?php
namespace App\Controllers;

use App\Models\User;

class AuthController {
    
    public function login($data) {
        if (empty($data['username']) || empty($data['password'])) {
            return [
                'status' => 'error',
                'message' => 'Username and password are required.'
            ];
        }

        $userModel = new User();
        $user = $userModel->findByUsername($data['username']);

        if ($user && password_verify($data['password'], $user['password'])) {
            return [
                'status' => 'success',
                'message' => 'Login successful!',
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'email' => $user['email']
                ]
            ];
        }

        return [
            'status' => 'error',
            'message' => 'Invalid username or password.'
        ];
    }
}
?>