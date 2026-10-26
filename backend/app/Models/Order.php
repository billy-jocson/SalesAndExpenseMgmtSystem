<?php

namespace App\Models;

use mysqli;

class Order
{
    private $db;

    public function __construct(mysqli $db = null)
    {
        $this->db = $db ?? (new Database())->getConnection();
    }

    private function clearResults()
    {
        while ($this->db->more_results() && $this->db->next_result()) {
            if ($result = $this->db->store_result()) {
                $result->free();
            }
        }
    }

    public function createPendingOrder($orderType, $supplierProductId, $storeProductId, $supplierId, $quantity, $requestedBy, $paymentMethod, $referenceCode)
    {
        $storeProductId = $storeProductId ?: null;
        $requestedBy = $requestedBy ?: null;
        
        $stmt = $this->db->prepare("CALL sp_pending_orders_create(?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param(
            'siiiisss',
            $orderType,
            $supplierProductId,
            $storeProductId,
            $supplierId,
            $quantity,
            $requestedBy,
            $paymentMethod,
            $referenceCode
        );
        $stmt->execute();
        $result = $stmt->get_result();
        $data = $result ? $result->fetch_assoc() : ['order_id' => $this->db->insert_id];
        $this->clearResults();
        $stmt->close();
        return $data;
    }

    public function getPendingOrders($supplierId, $status)
    {
        $stmt = $this->db->prepare("CALL sp_pending_orders_fetch_by_supplier(?, ?)");
        $stmt->bind_param('is', $supplierId, $status);
        $stmt->execute();
        $result = $stmt->get_result();
        $data = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
        $this->clearResults();
        $stmt->close();
        return $data;
    }

    public function getOrdersByRequester($userId, $status = 'all')
    {
        $sql = "SELECT po.*, sp.product_name, pc.category_name, s.supplier_name
                FROM pending_orders po
                JOIN suppliers s ON po.supplier_id = s.supplier_id
                JOIN supplier_products sp ON po.supplier_product_id = sp.supplier_product_id
                LEFT JOIN product_categories pc ON pc.category_id = sp.category_id
                WHERE po.requested_by = ?";
        $types = 'i';

        if ($status !== 'all') {
            $sql .= " AND po.status = ?";
        }

        $sql .= " ORDER BY po.created_at DESC";
        $stmt = $this->db->prepare($sql);
        if ($status === 'all') {
            $stmt->bind_param($types, $userId);
        } else {
            $types .= 's';
            $stmt->bind_param($types, $userId, $status);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        $orders = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
        $stmt->close();

        return $orders;
    }

    public function cancelPendingOrder($orderId, $userId)
    {
        $stmt = $this->db->prepare(
            "UPDATE pending_orders
             SET status = 'CANCELLED'
             WHERE order_id = ? AND requested_by = ? AND status = 'PENDING'"
        );
        $stmt->bind_param('ii', $orderId, $userId);
        $stmt->execute();
        $cancelled = $stmt->affected_rows === 1;
        $stmt->close();

        return $cancelled;
    }

    public function acceptOrder($orderId, $expiryDate, $batchNumber)
    {
        if (!empty($expiryDate)) {
            if (strtotime($expiryDate) < strtotime(date('Y-m-d'))) {
                throw new \Exception('Expiry date cannot be in the past - past dates are grayed out');
            }
        } else {
            $expiryDate = null;
        }

        $stmt = $this->db->prepare("CALL sp_pending_orders_accept(?, ?, ?)");
        $stmt->bind_param('iss', $orderId, $expiryDate, $batchNumber);
        $stmt->execute();
        $result = $stmt->get_result();
        $data = $result ? $result->fetch_assoc() : [];
        $this->clearResults();
        $stmt->close();
        return $data;
    }

    public function rejectOrder($orderId)
    {
        $stmt = $this->db->prepare("CALL sp_pending_orders_reject(?)");
        $stmt->bind_param('i', $orderId);
        $stmt->execute();
        $result = $stmt->get_result();
        $data = $result ? $result->fetch_assoc() : null;
        $this->clearResults();
        $stmt->close();
        
        return true;
    }
}