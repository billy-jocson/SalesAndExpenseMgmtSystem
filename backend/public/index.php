<?php

header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

foreach (glob(__DIR__ . '/../app/{Controllers,Models}/*.php', GLOB_BRACE) as $file) {
    require_once $file;
}

use App\Controllers\AuthController;
use App\Controllers\DashboardController;
use App\Controllers\ExpenseController;
use App\Controllers\ProductController;
use App\Controllers\ReportController;
use App\Controllers\SalesController;
use App\Controllers\StaffController;
use App\Controllers\SupplierController;
use App\Controllers\POSController;

function jsonResponse($data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data ?? ['status' => 'Success']);
    exit;
}

// POST (Recording), GET (Fetching), DELETE (Deletion), PATCH (Updating)
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Extract the URL path after /api/ so the router can match endpoint names.
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '';
$apiPath = strpos($requestUri, '/api/');
$path = $apiPath === false ? '/' : rtrim(substr($requestUri, $apiPath + 4), '/');

// Split the path into segments for routes with dynamic IDs, such as /products/12.
$segments = array_values(array_filter(explode('/', trim($path, '/'))));

// Read JSON request data and combine it with URL query parameters.
$input = json_decode(file_get_contents('php://input'), true);
$input = is_array($input) ? array_merge($_GET, $input) : $_GET;
if (!is_array($input)) {
    $input = [];
}

if (!empty($_POST)) {
    $input = array_merge($input, $_POST);
}

try {
    $response = null;
    $status = 200;

    switch (true) {
        case $requestMethod === 'POST' && $path === '/login':
            $response = (new AuthController())->login($input);
            break;
        case $requestMethod === 'GET' && $path === '/dashboard/analytics':
            $response = (new DashboardController())->getDashboardCardData($input);
            break;
        case $requestMethod === 'GET' && $path === '/dashboard/chart':
            $response = (new DashboardController())->getChartAnalytics($input);
            break;
        case $requestMethod === 'GET'
            && ($path === '/dashboard/line-chart' || $path === '/dashboard/LineChartData'):
            $response = (new DashboardController())->getLineChartData($input);
            break;
        case $requestMethod === 'GET'
            && ($path === '/dashboard/total-products' || $path === '/supplierProductAnalytics'):
            $response = (new DashboardController())->getTotalProductCardData($input);
            break;
        case $requestMethod === 'GET' && $path === '/products/categories':
            $response = (new ProductController())->getCategories();
            break;
        case $requestMethod === 'GET' && $path === '/products':
            $response = (new ProductController())->getProducts($input);
            break;
        case $requestMethod === 'POST' && $path === '/products':
            $response = (new ProductController())->addProduct($input, $_FILES ?? []);
            break;
        case $requestMethod === 'PATCH'
            && count($segments) === 2
            && $segments[0] === 'products':
            $input['product_id'] = $segments[1];
            $response = (new ProductController())->updateProduct($input, $_FILES ?? []);
            break;
        case $requestMethod === 'PATCH'
            && count($segments) === 3
            && $segments[0] === 'products'
            && $segments[2] === 'price':
            $input['product_id'] = $segments[1];
            $response = (new ProductController())->updateSellingPrice($input);
            break;
        case $requestMethod === 'DELETE'
            && count($segments) === 2
            && $segments[0] === 'products':
            $input['product_id'] = $segments[1];
            $response = (new ProductController())->softDelete($input);
            break;
        case $requestMethod === 'POST' && $path === '/products/store':
            $response = (new ProductController())->ensureStoreProduct($input);
            break;
        case $requestMethod === 'POST'
            && count($segments) === 3
            && $segments[0] === 'products'
            && $segments[2] === 'restock':
            $input['product_id'] = $segments[1];
            $response = (new ProductController())->restock($input);
            break;
        case $requestMethod === 'GET' && $path === '/expenses/categories':
            $response = (new ExpenseController())->getExpenseCategories();
            break;
        case $requestMethod === 'POST' && $path === '/expenses':
            $response = (new ExpenseController())->addExpense($input);
            break;
        case $requestMethod === 'GET' && $path === '/expenses':
            $response = (new ExpenseController())->getAllExpenses($input);
            break;
        case $requestMethod === 'GET' && $path === '/sales':
            $response = (new SalesController())->getAllSales($input);
            break;
        case $requestMethod === 'GET' && $path === '/suppliers':
            $response = (new SupplierController())->getSuppliers($input);
            break;
        case $requestMethod === 'POST' && $path === '/suppliers':
            $response = (new SupplierController())->addSupplier($input);
            break;
        case $requestMethod === 'PATCH'
            && count($segments) === 2
            && $segments[0] === 'suppliers':
            $input['supplier_id'] = $segments[1];
            $response = (new SupplierController())->updateSupplier($input);
            break;
        case $requestMethod === 'GET' && $path === '/suppliers/postal-codes':
            $response = (new SupplierController())->fetchPostalCodes($input);
            break;
        case $requestMethod === 'POST' && $path === '/suppliers/postal-codes':
            $response = (new SupplierController())->addPostalCode($input);
            break;
        case $requestMethod === 'DELETE'
            && count($segments) === 2
            && $segments[0] === 'suppliers':
            $input['supplier_id'] = $segments[1];
            $response = (new SupplierController())->softDelete($input);
            break;
        case $requestMethod === 'GET' && $path === '/payment-methods':
            $response = (new ExpenseController())->getPaymentMethods();
            break;
        case $requestMethod === 'GET' && $path === '/reports/summary':
            $response = (new ReportController())->getSummary($input);
            $status = ($response['status'] ?? '') === 'success' ? 200 : 422;
            break;
        case $requestMethod === 'GET' && $path === '/staff/roles':
            (new StaffController())->getRoles();
            break;
        case $requestMethod === 'GET' && $path === '/staff':
            (new StaffController())->fetchStaffs();
            break;
        case $requestMethod === 'GET'
            && count($segments) === 2
            && $segments[0] === 'staff':
            $_GET['staff_id'] = $segments[1];
            (new StaffController())->getStaff();
            break;
        case $requestMethod === 'POST' && $path === '/staff':
            (new StaffController())->addStaff();
            break;
        case $requestMethod === 'POST' && $path === '/checkout':
            $response = (new POSController())->checkout($input);
            $status = ($response['status'] ?? '') === 'success' ? 200 : 422;
            break;
        default:
            jsonResponse(['status' => 'Error', 'message' => 'Endpoint not found'], 404);
    }

    jsonResponse($response, $status);
} catch (Throwable $error) {
    jsonResponse(['status' => 'Error', 'message' => $error->getMessage()], 500);
}
