<?php

namespace App\Models;

use mysqli;

class Notification
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

    public function create($userId, $senderUserId, $type, $title, $message, $orderId)
    {
        $stmt = $this->db->prepare("CALL sp_notifications_create(?, ?, ?, ?, ?, ?)");
        $stmt->bind_param('iisssi', $userId, $senderUserId, $type, $title, $message, $orderId);
        $stmt->execute();
        $result = $stmt->get_result();
        $data = $result ? $result->fetch_assoc() : ['notification_id' => $this->db->insert_id];
        $this->clearResults();
        $stmt->close();
        return $data;
    }

    public function fetchByUser($userId, $filter = 'all')
    {
        $sql = "SELECT n.*, u.username as sender_name 
                FROM notifications n 
                LEFT JOIN users u ON n.sender_user_id = u.user_id 
                WHERE n.user_id = ?";
                
        $params = [$userId];
        $types = "i";

        if ($filter === 'unread') {
            $sql .= " AND n.is_read = 0";
        } elseif ($filter === 'requests') {
            // HAHANAPIN NITO ANG PAREHONG NEW ORDER AT RESTOCK REQUESTS!
            $sql .= " AND n.type IN ('ORDER_REQUEST', 'RESTOCK_REQUEST')";
        } elseif ($filter !== 'all') {
            $sql .= " AND n.type = ?";
            $params[] = $filter;
            $types .= "s";
        }

        $sql .= " ORDER BY n.created_at DESC LIMIT 50";

        try {
            $stmt = $this->db->prepare($sql);
            if ($types === "i") {
                $stmt->bind_param($types, $params[0]);
            } else {
                $stmt->bind_param($types, $params[0], $params[1]);
            }
            $stmt->execute();
            $result = $stmt->get_result();
            
            $notifications = [];
            while ($row = $result->fetch_assoc()) {
                $notifications[] = $row;
            }
            return $notifications;
        } catch (\Throwable $e) {
            error_log("Failed to fetch notifications: " . $e->getMessage());
            return [];
        }
    }
    
    public function markAsRead($notificationId, $userId)
    {
        $stmt = $this->db->prepare("CALL sp_notifications_mark_read(?, ?)");
        $stmt->bind_param('ii', $notificationId, $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $data = $result ? $result->fetch_assoc() : [];
        $this->clearResults();
        $stmt->close();
        return $data;
    }

    public function markAllAsRead($userId)
    {
        $stmt = $this->db->prepare("CALL sp_notifications_mark_all_read(?)");
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $data = $result ? $result->fetch_assoc() : [];
        $this->clearResults();
        $stmt->close();
        return $data;
    }

    public function fetchAdminOrdersStatus($adminUserId, $status = 'all')
    {
        $stmt = $this->db->prepare("CALL sp_admin_orders_status(?, ?)");
        $stmt->bind_param('is', $adminUserId, $status);
        $stmt->execute();
        $result = $stmt->get_result();
        $data = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
        $this->clearResults();
        $stmt->close();
        return $data;
    }

    public function getSupplierUserId($supplierId)
    {
        $stmt = $this->db->prepare("SELECT user_id FROM suppliers WHERE supplier_id = ? LIMIT 1");
        $stmt->bind_param('i', $supplierId);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result ? $result->fetch_assoc() : null;
        $stmt->close();
        return $row['user_id'] ?? null;
    }

    public function getProductName($supplierProductId)
    {
        $stmt = $this->db->prepare("SELECT product_name FROM supplier_products WHERE supplier_product_id = ? LIMIT 1");
        if (!$stmt) {
            return 'Product';
        }
        $stmt->bind_param('i', $supplierProductId);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result ? $result->fetch_assoc() : null;
        $stmt->close();
        
        return $row ? $row['product_name'] : 'Product';
    }

    public function getSupplierName($supplierId)
    {
        $stmt = $this->db->prepare("SELECT supplier_name FROM suppliers WHERE supplier_id = ? LIMIT 1");
        $stmt->bind_param('i', $supplierId);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result ? $result->fetch_assoc() : null;
        $stmt->close();
        return $row['supplier_name'] ?? null;
    }

    public function getOrderInfo($orderId)
    {
        $sql = "SELECT requested_by, supplier_product_id, supplier_id, requested_quantity 
                FROM pending_orders 
                WHERE order_id = ?";
        
        try {
            $stmt = $this->db->prepare($sql);
            if (!$stmt) return null;
            
            $stmt->bind_param("i", $orderId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result && $row = $result->fetch_assoc()) {
                return $row;
            }
            return null;
        } catch (\Throwable $e) {
            error_log("Failed to get order info: " . $e->getMessage());
            return null;
        }
    }
}
