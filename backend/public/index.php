<?php 
// backend/public/index.php

// 1. Handle CORS (Cross-Origin Resource Sharing) for React frontend
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS requests sent by browsers before actual POST/PUT requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 2. Autoload classes / Dependencies
// Adjust path if using Composer autoload or manual imports
require_once __DIR__ . '/../app/Controllers/AuthController.php';
require_once __DIR__ . '/../app/Models/User.php';

use App\Controllers\AuthController;

// 3. Parse Request Path & HTTP Method
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Parse incoming JSON payload into an associative array
$inputData = json_decode(file_get_contents('php://input'), true) ?? [];

// 4. Basic Router
switch ($requestUri) {
    case '/api/login':
    case '/backend/public/index.php/api/login':
        if ($requestMethod === 'POST') {
            $controller = new AuthController();
            $response = $controller->login($inputData);
            echo json_encode($response);
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
        }
        break;

    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found']);
        break;
}
?>