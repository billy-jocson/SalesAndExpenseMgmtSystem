<?php

header('Access-Control-Allow-Origin: http://localhost:3306');
header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');

require_once dirname(__DIR__) . '/vendor/autoload.php';

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
use App\Controllers\RoleController;
use App\Controllers\OrderController;
use App\Controllers\NotificationController;


function jsonResponse($data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data ?? ['status' => 'Success']);
    exit;
}

function cleanRequestInput($value)
{
    if (is_array($value)) {
        foreach ($value as $key => $item) {
            $value[$key] = cleanRequestInput($item);
        }

        return $value;
    }

    if (is_string($value)) {
        return trim(preg_replace('/[\x00-\x1F\x7F]/', '', $value));
    }

    return $value;
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
$input = cleanRequestInput($input);

try {
    $response = null;
    $status = 200;

    switch (true) {
        // Authenticate a user and return a session/token on successful login.
        case $requestMethod === 'POST' && $path === '/login':
            $response = (new AuthController())->login($input);
            break;

        // Fetch dashboard summary cards for the main overview screen.
        case $requestMethod === 'GET' && $path === '/dashboard/analytics':
            $response = (new DashboardController())->getDashboardCardData($input);
            break;

        // Retrieve dashboard chart data for sales and performance visuals.
        case $requestMethod === 'GET' && $path === '/dashboard/chart':
            $response = (new DashboardController())->getChartAnalytics($input);
            break;

        // Load the line-chart data used by the dashboard trend graphs.
        case $requestMethod === 'GET'
            && ($path === '/dashboard/line-chart' || $path === '/dashboard/LineChartData'):
            $response = (new DashboardController())->getLineChartData($input);
            break;

        // Fetch supplier-related dashboard chart data.
        case $requestMethod === 'GET' && $path === '/dashboard/supplier-chart':
            $response = (new DashboardController())->getSupplierChartData($input);
            break;

        // Load supplier trend line data for comparison charts.
        case $requestMethod === 'GET'
            && ($path === '/dashboard/supplier-line-chart' || $path === '/dashboard/SupplierLineChartData'):
            $response = (new DashboardController())->getSupplierLineChartData($input);
            break;

        // Get the total product count displayed on dashboard cards.
        case $requestMethod === 'GET'
            && ($path === '/dashboard/total-products' || $path === '/supplierProductAnalytics'):
            $response = (new DashboardController())->getTotalProductCardData($input);
            break;

        // Fetch all product categories used in filtering and forms.
        case $requestMethod === 'GET' && $path === '/products/categories':
            $response = (new ProductController())->getCategories();
            break;

        // List all products with optional filters and search parameters.
        case $requestMethod === 'GET' && $path === '/products':
            $response = (new ProductController())->getProducts($input);
            break;

        // Get products that are near expiry for inventory monitoring.
        case $requestMethod === 'GET' && $path === '/products/expiry':
            $response = (new ProductController())->getExpiryProducts();
            break;

        // Create a new product entry with uploaded product image files.
        case $requestMethod === 'POST' && $path === '/products':
            $response = (new ProductController())->addProduct($input, $_FILES ?? []);
            break;

        // Update a product using a product ID in the URL path.
        case $requestMethod === 'POST'
            && count($segments) === 2
            && $segments[0] === 'products':
            $input['product_id'] = $segments[1];
            $response = (new ProductController())->updateProduct($input, $_FILES ?? []);
            break;

        // Update an existing product record via PATCH with a product ID in the URL.
        case $requestMethod === 'PATCH'
            && count($segments) === 2
            && $segments[0] === 'products':
            $input['product_id'] = $segments[1];
            $response = (new ProductController())->updateProduct($input, $_FILES ?? []);
            break;

        // Change the selling price of a specific product by ID.
        case $requestMethod === 'PATCH'
            && count($segments) === 3
            && $segments[0] === 'products'
            && $segments[2] === 'price':
            $input['product_id'] = $segments[1];
            $response = (new ProductController())->updateSellingPrice($input);
            break;

        // Soft-delete a product by marking it unavailable instead of removing it permanently.
        case $requestMethod === 'DELETE'
            && count($segments) === 2
            && $segments[0] === 'products':
            $input['product_id'] = $segments[1];
            $response = (new ProductController())->softDelete($input);
            break;

        // Ensure a product is available in the store inventory list.
        case $requestMethod === 'POST' && $path === '/products/store':
            $response = (new ProductController())->ensureStoreProduct($input);
            break;

        // Add stock to a product using the /products/{id}/restock route.
        case $requestMethod === 'POST'
            && count($segments) === 3
            && $segments[0] === 'products'
            && $segments[2] === 'restock':
            $input['product_id'] = $segments[1];
            $response = (new ProductController())->restock($input);
            break;

        // Retrieve the list of expense categories for filters and form dropdowns.
        case $requestMethod === 'GET' && $path === '/expenses/categories':
            $response = (new ExpenseController())->getExpenseCategories();
            break;

        // Create a new expense record.
        case $requestMethod === 'POST' && $path === '/expenses':
            $response = (new ExpenseController())->addExpense($input);
            break;

        // Fetch all expense records for the expense management page.
        case $requestMethod === 'GET' && $path === '/expenses':
            $response = (new ExpenseController())->getAllExpenses($input);
            break;

        // List all sales records for the sales reporting page.
        case $requestMethod === 'GET' && $path === '/sales':
            $response = (new SalesController())->getAllSales($input);
            break;

        // Fetch all suppliers for supplier management screens.
        case $requestMethod === 'GET' && $path === '/suppliers':
            $response = (new SupplierController())->getSuppliers($input);
            break;

        // Add a new supplier to the system.
        case $requestMethod === 'POST' && $path === '/suppliers':
            $response = (new SupplierController())->addSupplier($input);
            break;

        // Update an existing supplier using the ID from the URL.
        case $requestMethod === 'PATCH'
            && count($segments) === 2
            && $segments[0] === 'suppliers':
            $input['supplier_id'] = $segments[1];
            $response = (new SupplierController())->updateSupplier($input);
            break;

        // Get postal code lookup data for supplier addresses.
        case $requestMethod === 'GET' && $path === '/suppliers/postal-codes':
            $response = (new SupplierController())->fetchPostalCodes($input);
            break;

        // Add a new postal code entry used by supplier records.
        case $requestMethod === 'POST' && $path === '/suppliers/postal-codes':
            $response = (new SupplierController())->addPostalCode($input);
            break;

        // Soft-delete a supplier record by ID.
        case $requestMethod === 'DELETE'
            && count($segments) === 2
            && $segments[0] === 'suppliers':
            $input['supplier_id'] = $segments[1];
            $response = (new SupplierController())->softDelete($input);
            break;

        // Fetch payment method options for expense entry forms.
        case $requestMethod === 'GET' && $path === '/payment-methods':
            $response = (new ExpenseController())->getPaymentMethods();
            break;

        // Get summary data for the reports dashboard.
        case $requestMethod === 'GET' && $path === '/reports/summary':
            $response = (new ReportController())->getSummary($input);
            $status = ($response['status'] ?? '') === 'success' ? 200 : 422;
            break;

        // Get the list of staff roles available in the system.
        case $requestMethod === 'GET' && $path === '/staff/roles':
            (new StaffController())->getRoles();
            break;

        // Fetch all staff records for the staff management page.
        case $requestMethod === 'GET' && $path === '/staff':
            (new StaffController())->fetchStaffs();
            break;

        // Retrieve a single staff member using the ID in the URL.
        case $requestMethod === 'GET'
            && count($segments) === 2
            && $segments[0] === 'staff':
            $_GET['staff_id'] = $segments[1];
            (new StaffController())->getStaff();
            break;

        // Create a new staff account.
        case $requestMethod === 'POST' && $path === '/staff':
            (new StaffController())->addStaff();
            break;

        // Process a point-of-sale checkout using the current cart data.
        case $requestMethod === 'POST' && $path === '/checkout':
            $response = (new POSController())->checkout($input);
            $status = ($response['status'] ?? '') === 'success' ? 200 : 422;
            break;

        // Retrieve all roles configured in the application.
        case $requestMethod === 'GET' && $path === '/roles':
            $response = (new RoleController())->getRoles($input);
            break;

        // Create a new user role.
        case $requestMethod === 'POST' && $path === '/roles':
            $response = (new RoleController())->addRole($input);
            break;

        // Update a role based on the URL ID.
        case $requestMethod === 'PATCH' && count($segments) === 2 && $segments[0] === 'roles':
            $input['role_id'] = $segments[1];
            $response = (new RoleController())->updateRole($input);
            break;

        // Delete a role by ID.
        case $requestMethod === 'DELETE' && count($segments) === 2 && $segments[0] === 'roles':
            $input['role_id'] = $segments[1];
            $response = (new RoleController())->deleteRole($input);
            break;

        // Remove a staff member by ID.
        case $requestMethod === 'DELETE'
            && count($segments) === 2
            && $segments[0] === 'staff':
            $_GET['staff_id'] = $segments[1];
            (new StaffController())->deleteStaff();
            break;

        // Update an existing staff member with the ID from the route.
        case $requestMethod === 'PATCH' &&
            count($segments) === 2 &&
            $segments[0] === 'staff':
            $input['staff_id'] = $segments[1];
            (new StaffController())->updateStaff($input);
            break;

        // Create a new pending order before it is accepted.
        case $requestMethod === 'POST' && $path === '/orders/pending':
            $response = (new OrderController())->createPendingOrder($input);
            break;

        // List pending orders waiting for approval or processing.
        case $requestMethod === 'GET' && $path === '/orders/pending':
            $response = (new OrderController())->fetchPendingOrders($input);
            break;

        // List orders created by the requesting user.
        case $requestMethod === 'GET' && $path === '/orders/mine':
            $response = (new OrderController())->fetchMyOrders($input);
            break;

        // Cancel a specific pending order owned by the requesting user.
        case $requestMethod === 'DELETE'
            && count($segments) === 2
            && $segments[0] === 'orders':
            $input['order_id'] = $segments[1];
            $response = (new OrderController())->cancelOrder($input);
            break;

        // Accept an order using the order ID in the route.
        case $requestMethod === 'POST'
            && count($segments) === 3
            && $segments[0] === 'orders'
            && $segments[2] === 'accept':
            $input['order_id'] = $segments[1];
            $response = (new OrderController())->acceptOrder($input);
            break;

        // Reject an order using the order ID in the route.
        case $requestMethod === 'POST'
            && count($segments) === 3
            && $segments[0] === 'orders'
            && $segments[2] === 'reject':
            $input['order_id'] = $segments[1];
            $response = (new OrderController())->rejectOrder($input);
            break;

        // Fetch notifications for the logged-in user.
        case $requestMethod === 'GET' && $path === '/notifications':
            $response = (new NotificationController())->fetchNotifications($input);
            break;

        // Mark a single notification as read.
        case $requestMethod === 'POST' && $path === '/notifications/mark-read':
            $response = (new NotificationController())->markAsRead($input);
            break;

        // Mark all notifications as read for the current user.
        case $requestMethod === 'POST' && $path === '/notifications/mark-all-read':
            $response = (new NotificationController())->markAllAsRead($input);
            break;

        // Fetch admin order-status information.
        case $requestMethod === 'GET' && $path === '/admin/orders-status':
            $response = (new NotificationController())->fetchAdminOrdersStatus($input);
            break;

        // Return a 404 error when no route matches the request.
        default:
            jsonResponse(['status' => 'Error', 'message' => 'Endpoint not found'], 404);
    }

    jsonResponse($response, $status);
} catch (Throwable $error) {
    jsonResponse(['status' => 'Error', 'message' => $error->getMessage()], 500);
}
