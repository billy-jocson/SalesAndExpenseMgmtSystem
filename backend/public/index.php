<?php


header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}


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

use App\Controllers\AuthController;
use App\Controllers\DashboardController;
use App\Controllers\ProductController;
use App\Controllers\ExpenseController;
use App\Controllers\SalesController;
use App\Controllers\SupplierController;


$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$apiPath = strpos($requestUri, '/api/');
$requestUri = $apiPath === false ? $requestUri : substr($requestUri, $apiPath);
$requestMethod = $_SERVER['REQUEST_METHOD'];


$inputData = json_decode(file_get_contents('php://input'), true) ?? [];

if ($requestMethod !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'Error', 'message' => 'Method not allowed. Use POST.']);
    exit;
}


function sendJson($response) {
    $httpCode = $response['http_code'] ?? 200;
    unset($response['http_code']);
    http_response_code($httpCode);
    echo json_encode($response);
}


try {
    switch ($requestUri) {
        case '/api/login':
            $controller = new AuthController();
            $response = $controller->login($inputData);
            sendJson($response);
            break;

        case '/api/dashboardAnalytics':
            $controller = new DashboardController();
            $response = $controller->getDashboardCardData($inputData);
            sendJson($response);
            break;

        case '/api/chartData':
            $controller = new DashboardController();
            $response = $controller->getChartAnalytics();
            sendJson($response);
            break;

        case '/api/fetchCategories':
            $controller = new ProductController();
            $response = $controller->getCategories();
            sendJson($response);
            break;

        case '/api/fetchProducts':
            $controller = new ProductController();
            $response = $controller->getProducts($inputData);
            sendJson($response);
            break;

        case '/api/updateSellingPrice':
            $controller = new ProductController();
            $response = $controller->updateSellingPrice($inputData);
            sendJson($response);
            break;

        case '/api/deleteProduct':
            $controller = new ProductController();
            $response = $controller->softDelete($inputData);
            sendJson($response);
            break;

        case '/api/restockProduct':
            $controller = new ProductController();
            $response = $controller->restock($inputData);
            sendJson($response);
            break;

        case '/api/getExpenseCategories':
            $controller = new ExpenseController();
            $response = $controller->getExpenseCategories();
            sendJson($response);
            break;

        case '/api/addExpense':
            $controller = new ExpenseController();
            $response = $controller->addExpense($inputData);
            sendJson($response ?? ['status' => 'Success', 'message' => 'Expense added successfully.', 'http_code' => 201]);
            break;

        case '/api/fetchAllExpenses':
            $controller = new ExpenseController();
            $response = $controller->getAllExpenses($inputData);
            sendJson($response);
            break;

        case '/api/fetchAllSales':
            $controller = new SalesController();
            $response = $controller->getAllSales($inputData);
            sendJson($response);
            break;

        case '/api/fetchSuppliers':
            $controller = new SupplierController();
            $response = $controller->getSuppliers($inputData);

            if (isset($response['data']) && $response['status'] === 'Success') {
                http_response_code($response['http_code'] ?? 200);
                echo json_encode($response['data']);
            } else {
                sendJson($response);
            }
            break;

        case '/api/addSupplier':
            $controller = new SupplierController();
            $response = $controller->addSupplier($inputData);
            sendJson($response);
            break;

        case '/api/updateSupplier':
            $controller = new SupplierController();
            $response = $controller->updateSupplier($inputData);
            sendJson($response);
            break;

        case '/api/deleteSupplier':
            $controller = new SupplierController();
            $response = $controller->softDelete($inputData);
            sendJson($response);
            break;

        case '/api/getPaymentMethods':
            $controller = new ExpenseController();
            $response = $controller->getPaymentMethods();
            sendJson($response);
            break;

        default:
            http_response_code(404);
            echo json_encode(['status' => 'Error', 'message' => 'Endpoint not found: ' . $requestUri]);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'Error',
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
?>
