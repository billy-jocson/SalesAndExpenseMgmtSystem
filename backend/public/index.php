<?php

// 1. Handle CORS (Cross-Origin Resource Sharing) for React frontend
header("Access-Control-Allow-Origin: http://localhost:5173");
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
require_once __DIR__ . '/../app/Controllers/DashboardController.php';
require_once __DIR__ . '/../app/Controllers/ProductController.php';
require_once __DIR__ . '/../app/Controllers/ExpenseController.php';
require_once __DIR__ . '/../app/Controllers/SalesController.php';
require_once __DIR__ . '/../app/Controllers/SupplierController.php';
require_once __DIR__ . '/../app/Models/Database.php';
require_once __DIR__ . '/../app/Models/Dashboard.php';
require_once __DIR__ . '/../app/Models/Expense.php';
require_once __DIR__ . '/../app/Models/Sales.php';
require_once __DIR__ . '/../app/Models/Product.php';
require_once __DIR__ . '/../app/Models/Supplier.php';
require_once __DIR__ . '/../app/Models/User.php';
require_once __DIR__ . '/../app/Controllers/POSController.php';
// require_once __DIR__ . '/../app/Controllers/POSController.php'; //dagdag ni aljon

use App\Controllers\AuthController;
use App\Controllers\DashboardController;
use App\Controllers\ProductController;
use App\Controllers\ExpenseController;
use App\Controllers\SalesController;
use App\Controllers\SupplierController;
use App\Controllers\POSController;
// use App\Controllers\POSController; //dagdag ni aljon

// 3. Parse Request Path & HTTP Method
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$apiPath = strpos($requestUri, '/api/');
$requestUri = $apiPath === false ? $requestUri : substr($requestUri, $apiPath);
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Parse incoming JSON payload into an associative array
$inputData = json_decode(file_get_contents('php://input'), true) ?? [];

if ($requestMethod !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
    exit;
}

// 4. Basic Router
switch ($requestUri) {
    case '/api/login':
        $controller = new AuthController();
        $response = $controller->login($inputData);
        echo json_encode($response);
        break;

    case '/api/dashboardAnalytics':
        $controller = new DashboardController();
        $response = $controller->getDashboardCardData($inputData);
        http_response_code(200);
        echo json_encode($response);
        break;

    case '/api/chartData':
        $controller = new DashboardController();
        $response = $controller->getChartAnalytics();
        http_response_code(200);
        echo json_encode($response);
        break;

    case '/api/fetchCategories':
        $controller = new ProductController();
        $response = $controller->getCategories();
        http_response_code(200);
        echo json_encode($response);
        break;

    case '/api/fetchProducts':
        $controller = new ProductController();
        $response = $controller->getProducts($inputData);
        http_response_code(200);
        echo json_encode($response);
        break;

    case '/api/updateSellingPrice':
        $controller = new ProductController();
        $response = $controller->updateSellingPrice($inputData);
        http_response_code(200);
        echo json_encode($response);
        break;

    case '/api/deleteProduct':
        $controller = new ProductController();
        $response = $controller->softDelete($inputData);
        http_response_code(200);
        echo json_encode($response);
        break;

    case '/api/restockProduct':
        $controller = new ProductController();
        $response = $controller->restock($inputData);
        http_response_code(200);
        echo json_encode($response);
        break;

    case '/api/getExpenseCategories':
        $controller = new ExpenseController();
        $response = $controller->getExpenseCategories();
        http_response_code(200);
        echo json_encode($response);
        break;

    case '/api/addExpense':
        $controller = new ExpenseController();
        $response = $controller->addExpense($inputData);
        http_response_code(200);
        echo json_encode($response ?? ['status' => 'success', 'message' => 'Expense added successfully.']);
        break;

    case '/api/fetchAllExpenses':
        $controller = new ExpenseController();
        $response = $controller->getAllExpenses($inputData);
        http_response_code(200);
        echo json_encode($response);
        break;

    case '/api/fetchAllSales':
        $controller = new SalesController();
        $response = $controller->getAllSales($inputData);
        http_response_code(200);
        echo json_encode($response);
        break;

    case '/api/fetchSuppliers':
        $controller = new SupplierController();
        $response = $controller->getSuppliers($inputData);
        http_response_code(200);
        echo json_encode($response);
        break;

    case '/api/deleteSupplier':
        $controller = new SupplierController();
        $response = $controller->softDelete($inputData);
        http_response_code(200);
        echo json_encode($response);
        break;

    case '/api/getPaymentMethods':
        $controller = new ExpenseController();
        $response = $controller->getPaymentMethods();
        http_response_code(200);
        echo json_encode($response);
        break;
    case '/api/checkout':
        $controller = new POSController();
        $response = $controller->checkout($inputData);
        http_response_code(200);
        echo json_encode($response);
        break;

    // case '/api/checkout': //dagdag ni aljon
    //     $controller = new POSController();
    //     $response = $controller->checkout($inputData);
    //     http_response_code($response['status'] === 'Success' ? 200 : 400);
    //     echo json_encode($response);
    //     break;

    default:
        http_response_code(404);
        echo json_encode(['message' => 'Endpoint not found']);
        break;
}
