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

    public function acceptOrder($orderId, $expiryDate, $batchNumber)
    {
        if (strtotime($expiryDate) < strtotime(date('Y-m-d'))) {
            throw new \Exception('Expiry date cannot be in the past - past dates are grayed out');
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
        $stmt = $this->db->prepare("UPDATE pending_orders SET status = 'REJECTED', accepted_at = NOW() WHERE order_id = ?");
        if (!$stmt) {
            return false;
        }
        $stmt->bind_param('i', $orderId);
        $success = $stmt->execute();
        $stmt->close();
        
        // Ibabalik nito ang true kapag naging successful ang pag-execute (kahit zero rows affected)
        return $success; 
    }
}
