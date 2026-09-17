<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

spl_autoload_register(function($class) {
    $prefix = 'App\\';
    if (strpos($class, $prefix) === 0) {
        $relative = str_replace($prefix, '', $class);
        $relative = str_replace('\\', '/', $relative);
        $file = __DIR__ . '/../app/' . $relative . '.php';
        if (file_exists($file)) require_once $file;
    }
});

require_once __DIR__ . '/../app/Models/Database.php';
use App\Models\Database;
use App\Controllers\StaffController;

$uri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

function sendJson($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

// AUTH
if (strpos($uri, '/api/login') !== false && $method === 'POST') {
    $input = json_decode(file_get_contents("php://input"), true);
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';
    if (empty($username) || empty($password)) {
        sendJson(["status" => "Error", "message" => "Username and password required"], 400);
    }
    try {
        $db = (new Database())->getConnection();
        $stmt = $db->prepare("SELECT u.user_id, u.username, u.password_hash, u.role_id, r.role_name FROM users u LEFT JOIN roles r ON r.role_id = u.role_id WHERE u.username = ? AND u.is_active = 1 LIMIT 1");
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result->num_rows === 0) sendJson(["status" => "Error", "message" => "Invalid username or password"], 401);
        $user = $result->fetch_assoc();
        if (!password_verify($password, $user['password_hash'])) sendJson(["status" => "Error", "message" => "Invalid username or password"], 401);
        sendJson([
            "status" => "Success",
            "message" => "Login successful",
            "user" => ["user_id" => $user['user_id'], "username" => $user['username'], "role" => $user['role_name'], "role_id" => $user['role_id']],
            "token" => base64_encode($user['user_id'] . ":" . time())
        ], 200);
    } catch (Exception $e) {
        sendJson(["status" => "Error", "message" => "Server error: " . $e->getMessage()], 500);
    }
}

if (strpos($uri, '/api/health') !== false) {
    sendJson(["status" => "OK", "message" => "Backend is running", "time" => date("Y-m-d H:i:s")], 200);
}


if (strpos($uri, '/api/getStaffRoles') !== false) {
    (new StaffController())->getRoles();
}
if (strpos($uri, '/api/fetchStaffs') !== false) {
    (new StaffController())->fetchStaffs();
}
if (strpos($uri, '/api/getStaff') !== false) {
    (new StaffController())->getStaff();
}
if (strpos($uri, '/api/addStaff') !== false) {
    (new StaffController())->addStaff();
}

sendJson(["status" => "Error", "message" => "Route not found: " . $uri], 404);
