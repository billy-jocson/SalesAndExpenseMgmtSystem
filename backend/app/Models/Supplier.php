<?php

namespace App\Models;

use mysqli;
use Exception;

class Supplier
{
    private $db;

    public function __construct(mysqli $db = null)
    {
        $this->db = $db ?? (new Database())->getConnection();
    }

    public function fetchSuppliers($search = '')
    {
        $searchTerm = "%{$search}%";
        $stmt = $this->db->prepare("
        SELECT s.*, u.username, u.user_id 
        FROM suppliers s 
        LEFT JOIN users u ON u.user_id = s.user_id 
        WHERE s.is_active = 1 AND (s.supplier_name LIKE ? OR s.contact_person LIKE ? OR s.email LIKE ? OR s.phone LIKE ? OR s.street_address LIKE ?)
    ");
        $stmt->bind_param('sssss', $searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_all(MYSQLI_ASSOC);
    }

    public function getSupplierById($supplierId)
    {
        $stmt = $this->db->prepare("SELECT s.*, u.username, u.user_id FROM suppliers s LEFT JOIN users u ON u.user_id = s.user_id WHERE s.supplier_id = ? LIMIT 1");
        $stmt->bind_param('i', $supplierId);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc();
    }

    public function addSupplier($data)
    {
        $this->db->begin_transaction();
        try {
            if (empty($data['username']) || empty($data['password'])) {
                throw new Exception("Username and password required");
            }
            $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);
            $roleId = 4;
            $isActive = 1;

            $stmt = $this->db->prepare("INSERT INTO users (username, password_hash, role_id, is_active) VALUES (?, ?, ?, ?)");
            $stmt->bind_param('ssii', $data['username'], $passwordHash, $roleId, $isActive);
            $stmt->execute();
            $userId = $this->db->insert_id;

            $stmt = $this->db->prepare("INSERT INTO suppliers (user_id, supplier_name, contact_person, email, phone, street_address, postal_code, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->bind_param('issssssi', $userId, $data['supplier_name'], $data['contact_person'], $data['email'], $data['phone'], $data['street_address'], $data['postal_code'], $isActive);
            $stmt->execute();

            $this->db->commit();
            return ['user_id' => $userId, 'supplier_id' => $this->db->insert_id];
        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }

    public function updateSupplier($data)
    {
        $this->db->begin_transaction();
        try {
            $supplierId = (int)$data['supplier_id'];
            $existing = $this->getSupplierById($supplierId);
            if (!$existing) throw new Exception("Supplier not found");
            $userId = $existing['user_id'];

            if (!empty($data['username']) && $data['username'] !== $existing['username']) {
                $stmt = $this->db->prepare("UPDATE users SET username = ? WHERE user_id = ?");
                $stmt->bind_param('si', $data['username'], $userId);
                $stmt->execute();
            }

            if (!empty($data['password'])) {
                $hash = password_hash($data['password'], PASSWORD_DEFAULT);
                $stmt = $this->db->prepare("UPDATE users SET password_hash = ? WHERE user_id = ?");
                $stmt->bind_param('si', $hash, $userId);
                $stmt->execute();
            }

            $stmt = $this->db->prepare("UPDATE suppliers SET supplier_name = ?, contact_person = ?, email = ?, phone = ?, street_address = ?, postal_code = ? WHERE supplier_id = ?");
            $stmt->bind_param('ssssssi', $data['supplier_name'], $data['contact_person'], $data['email'], $data['phone'], $data['street_address'], $data['postal_code'], $supplierId);
            $stmt->execute();

            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }

    public function softDelete($supplierId)
    {
        $stmt = $this->db->prepare("UPDATE suppliers SET is_active = 0 WHERE supplier_id = ? AND is_active = 1");
        $stmt->bind_param('i', $supplierId);
        return $stmt->execute() && $stmt->affected_rows > 0;
    }
}
