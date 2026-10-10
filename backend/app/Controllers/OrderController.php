<?php
// backend/app/Controllers/OrderController.php - FIXED WITH NOTIFICATIONS BOTH ENDS
// Pattern same as ProductController / ExpenseController (working)

namespace App\Controllers;

use App\Models\Order;
use App\Models\Notification;

class OrderController
{
    private $orderModel;
    private $notificationModel;

    public function __construct()
    {
        $this->orderModel = new Order();
        $this->notificationModel = new Notification();
    }

    public function createPendingOrder($data = [])
    {
        $orderType = $data['order_type'] ?? 'RESTOCK';
        $supplierProductId = (int) ($data['supplier_product_id'] ?? 0);
        $storeProductId = isset($data['store_product_id']) && $data['store_product_id'] ? (int) $data['store_product_id'] : null;
        $supplierId = (int) ($data['supplier_id'] ?? 0);
        $quantity = (int) ($data['quantity'] ?? 0);
        $requestedBy = isset($data['requested_by']) ? (int) $data['requested_by'] : null;
        $paymentMethod = trim((string) ($data['payment_method'] ?? 'Cash'));
        $referenceCode = trim((string) ($data['reference_code'] ?? ''));

        if ($supplierProductId <= 0 || $supplierId <= 0 || $quantity <= 0) {
            return [
                'status' => 'Error',
                'message' => 'Supplier product, supplier, and quantity are required.'
            ];
        }

        try {
            $result = $this->orderModel->createPendingOrder(
                $orderType,
                $supplierProductId,
                $storeProductId,
                $supplierId,
                $quantity,
                $requestedBy,
                $paymentMethod,
                $referenceCode
            );

            $orderId = $result['order_id'] ?? null;

            // --- NOTIFICATION BOTH ENDS: Notify Supplier ---
            if ($orderId) {
                try {
                    $supplierUserId = $this->notificationModel->getSupplierUserId($supplierId);
                    if ($supplierUserId) {
                        $productName = $this->notificationModel->getProductName($supplierProductId) ?? 'Product';
                        
                        $notifType = $orderType === 'NEW_ORDER' ? 'ORDER_REQUEST' : 'RESTOCK_REQUEST';
                        $notifTitle = $orderType === 'NEW_ORDER' 
                            ? "New Order Request - {$productName}" 
                            : "Restock Request - {$productName}";
                        $notifMessage = $orderType === 'NEW_ORDER'
                            ? "Admin requested NEW ORDER: {$productName} x{$quantity} (Order #{$orderId}). Please accept and set expiry date!"
                            : "Admin requested RESTOCK: {$productName} x{$quantity} (Order #{$orderId}). Please accept and set expiry date!";

                        $this->notificationModel->create(
                            $supplierUserId,
                            $requestedBy,
                            $notifType,
                            $notifTitle,
                            $notifMessage,
                            $orderId
                        );
                    }
                } catch (\Throwable $notifError) {
                    error_log("Notif to supplier failed: " . $notifError->getMessage());
                }
            }

            return [
                'status' => 'Success',
                'message' => 'Order request created - waiting for supplier to accept and set expiry',
                'order_id' => $orderId
            ];
        } catch (\Throwable $error) {
            return ['status' => 'Error', 'message' => $error->getMessage()];
        }
    }

    public function fetchPendingOrders($data = [])
    {
        $supplierId = (int) ($data['supplier_id'] ?? 0);
        $status = trim((string) ($data['status'] ?? 'PENDING'));
        $search = trim((string) ($data['search'] ?? ''));

        if ($supplierId <= 0) {
            return ['status' => 'Error', 'message' => 'supplier_id is required.'];
        }

        try {
            $orders = $this->orderModel->getPendingOrders($supplierId, $status ?: null);

            if ($search !== '') {
                $orders = array_values(array_filter($orders, function ($o) use ($search) {
                    return stripos($o['product_name'] ?? '', $search) !== false
                        || stripos($o['category_name'] ?? '', $search) !== false;
                }));
            }

            return [
                'status' => 'Success',
                'message' => 'Pending orders retrieved.',
                'orders' => $orders
            ];
        } catch (\Throwable $error) {
            return ['status' => 'Error', 'message' => $error->getMessage()];
        }
    }

    public function acceptOrder($data = [])
    {
        $orderId = (int) ($data['order_id'] ?? $data['id'] ?? 0);
        $expiryDate = $data['expiration_date'] ?? $data['expiry_date'] ?? '';
        $batchNumber = trim((string) ($data['batch_number'] ?? ''));
        $supplierUserId = $data['supplier_user_id'] ?? null;

        if ($orderId <= 0 || $expiryDate === '') {
            return ['status' => 'Error', 'message' => 'Order ID and expiry date are required.'];
        }

        try {
            $orderInfo = null;
            try {
                $orderInfo = $this->notificationModel->getOrderInfo($orderId);
            } catch (\Throwable $e) {}

            $result = $this->orderModel->acceptOrder($orderId, $expiryDate, $batchNumber ?: null);

            // GUMAWA NG NOTIFICATION KAY ADMIN NANG WALANG ERROR
            if ($orderInfo && !empty($orderInfo['requested_by'])) {
                try {
                    $adminUserId = $orderInfo['requested_by'];
                    
                    $productName = 'Product';
                    if (method_exists($this->notificationModel, 'getProductName')) {
                        $productName = $this->notificationModel->getProductName($orderInfo['supplier_product_id']) ?? 'Product';
                    }

                    if (!$supplierUserId && method_exists($this->notificationModel, 'getSupplierUserId')) {
                        $supplierUserId = $this->notificationModel->getSupplierUserId($orderInfo['supplier_id']);
                    }
                    $supplierUserId = $supplierUserId ?: $adminUserId; // Fallback para hindi mag-null sa database

                    $notifTitle = "Order Accepted - {$productName}";
                    $notifMessage = "Supplier accepted your order #{$orderId}: {$productName}. Expiry: {$expiryDate}. Stock added!";

                    $this->notificationModel->create(
                        $adminUserId,
                        $supplierUserId,
                        'ORDER_ACCEPTED',
                        $notifTitle,
                        $notifMessage,
                        $orderId
                    );
                } catch (\Throwable $notifError) {
                    error_log("Notif accept failed: " . $notifError->getMessage());
                }
            }

            return [
                'status' => 'Success',
                'message' => 'Order accepted',
                'batchNumber' => $result['batchNumber'] ?? null,
                'amount' => $result['amount'] ?? 0,
                'store_product_id' => $result['store_product_id'] ?? null
            ];
        } catch (\Throwable $error) {
            return ['status' => 'Error', 'message' => $error->getMessage()];
        }
    }

    public function rejectOrder($data = [])
    {
        $orderId = (int) ($data['order_id'] ?? $data['id'] ?? 0);
        $supplierUserId = $data['supplier_user_id'] ?? null;
        $reason = $data['reason'] ?? 'Rejected by supplier';

        if ($orderId <= 0) {
            return ['status' => 'Error', 'message' => 'Order ID is required.'];
        }

        try {
            $orderInfo = null;
            try {
                $orderInfo = $this->notificationModel->getOrderInfo($orderId);
            } catch (\Throwable $e) {}

            $deleted = $this->orderModel->rejectOrder($orderId);

            // GUMAWA NG NOTIFICATION KAY ADMIN NANG WALANG ERROR
            if ($deleted && $orderInfo && !empty($orderInfo['requested_by'])) {
                try {
                    $adminUserId = $orderInfo['requested_by'];
                    
                    $productName = 'Product';
                    if (method_exists($this->notificationModel, 'getProductName')) {
                        $productName = $this->notificationModel->getProductName($orderInfo['supplier_product_id']) ?? 'Product';
                    }

                    if (!$supplierUserId && method_exists($this->notificationModel, 'getSupplierUserId')) {
                        $supplierUserId = $this->notificationModel->getSupplierUserId($orderInfo['supplier_id']);
                    }
                    $supplierUserId = $supplierUserId ?: $adminUserId; // Fallback para hindi mag-null sa database

                    $notifTitle = "Order Rejected - {$productName}";
                    $notifMessage = "Supplier rejected your order #{$orderId}: {$productName}. Reason: {$reason}";

                    $this->notificationModel->create(
                        $adminUserId,
                        $supplierUserId,
                        'ORDER_REJECTED',
                        $notifTitle,
                        $notifMessage,
                        $orderId
                    );
                } catch (\Throwable $notifError) {
                    error_log("Notif reject failed: " . $notifError->getMessage());
                }
            }

            return [
                'status' => $deleted ? 'Success' : 'Error',
                'message' => $deleted ? 'Order rejected.' : 'Order was not rejected.'
            ];
        } catch (\Throwable $error) {
            return ['status' => 'Error', 'message' => $error->getMessage()];
        }
    }
}
