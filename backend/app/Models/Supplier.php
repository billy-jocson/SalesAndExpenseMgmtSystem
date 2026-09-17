<?php

namespace App\Models;

use mysqli;
use Exception;

class Supplier
{
    private const ROLE_SUPPLIER = 4;
    private const DEFAULT_POSTAL = '4027';

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
            WHERE s.is_active = 1 AND (
                s.supplier_name LIKE ? OR 
                s.contact_person LIKE ? OR 
                s.email LIKE ? OR 
                s.phone LIKE ? OR 
                s.street_address LIKE ?
            )
            ORDER BY s.supplier_name ASC
        ");
        $stmt->bind_param('sssss', $searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_all(MYSQLI_ASSOC);
    }

    public function getSupplierById($supplierId)
    {
        $stmt = $this->db->prepare("
            SELECT s.*, u.username, u.user_id 
            FROM suppliers s 
            LEFT JOIN users u ON u.user_id = s.user_id 
            WHERE s.supplier_id = ? LIMIT 1
        ");
        $stmt->bind_param('i', $supplierId);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc();
    }

    
    private function isUsernameTaken($username, $excludeUserId = null)
    {
        if ($excludeUserId) {
            $stmt = $this->db->prepare("SELECT user_id FROM users WHERE username = ? AND user_id != ? LIMIT 1");
            $stmt->bind_param('si', $username, $excludeUserId);
        } else {
            $stmt = $this->db->prepare("SELECT user_id FROM users WHERE username = ? LIMIT 1");
            $stmt->bind_param('s', $username);
        }
        $stmt->execute();
        return $stmt->get_result()->num_rows > 0;
    }

    
    private function getSupplierRoleId(): int
    {
        try {
            $stmt = $this->db->prepare("SELECT role_id FROM roles WHERE role_name = 'supplier' LIMIT 1");
            if ($stmt) {
                $stmt->execute();
                $row = $stmt->get_result()->fetch_assoc();
                if ($row && isset($row['role_id'])) {
                    return (int)$row['role_id'];
                }
            }
        } catch (Exception $e) {
            
        }
        return self::ROLE_SUPPLIER;
    }

    
    private function validateAddData($data)
    {
        if (empty($data['supplier_name'])) {
            throw new Exception("Supplier name is required.");
        }
        if (strlen($data['supplier_name']) < 2) {
            throw new Exception("Supplier name must be at least 2 characters.");
        }
        if (empty($data['username'])) {
            throw new Exception("Username is required.");
        }
        if (strlen($data['username']) < 3) {
            throw new Exception("Username must be at least 3 characters.");
        }
        if (!preg_match('/^[a-zA-Z0-9_]+$/', $data['username'])) {
            throw new Exception("Username can only contain letters, numbers and underscore.");
        }
        if ($this->isUsernameTaken($data['username'])) {
            throw new Exception("Username already exists. Please choose another.");
        }
        if (empty($data['password'])) {
            throw new Exception("Password is required.");
        }
        if (strlen($data['password']) < 8) {
            throw new Exception("Password must be at least 8 characters.");
        }
        if (!empty($data['email']) && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            throw new Exception("Invalid email format.");
        }
    }

    
    public function addSupplier($data)
    {
        $this->db->begin_transaction();
        try {
            $this->validateAddData($data);

            $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);
            $roleId = $this->getSupplierRoleId();
            $isActive = 1;

            
            $stmt = $this->db->prepare("INSERT INTO users (username, password_hash, role_id, is_active) VALUES (?, ?, ?, ?)");
            $stmt->bind_param('ssii', $data['username'], $passwordHash, $roleId, $isActive);
            $stmt->execute();
            $userId = $this->db->insert_id;

            if ($userId <= 0) {
                throw new Exception("Failed to create user account.");
            }

            
            $postalCode = $data['postal_code'] ?? self::DEFAULT_POSTAL;
            $stmt = $this->db->prepare("INSERT INTO suppliers (user_id, supplier_name, contact_person, email, phone, street_address, postal_code, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->bind_param(
                'issssssi',
                $userId,
                $data['supplier_name'],
                $data['contact_person'],
                $data['email'],
                $data['phone'],
                $data['street_address'],
                $postalCode,
                $isActive
            );
            $stmt->execute();

            $supplierId = $this->db->insert_id;

            $this->db->commit();
            return ['user_id' => $userId, 'supplier_id' => $supplierId];

        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }

    public function updateSupplier($data)
    {
        $this->db->begin_transaction();
        try {
            $supplierId = (int)($data['supplier_id'] ?? 0);
            if ($supplierId <= 0) {
                throw new Exception("Valid supplier ID is required.");
            }

            $existing = $this->getSupplierById($supplierId);
            if (!$existing) {
                throw new Exception("Supplier not found.");
            }

            $userId = (int)$existing['user_id'];

            if (empty($data['supplier_name'])) {
                throw new Exception("Supplier name is required.");
            }

            
            if (!empty($data['email']) && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                throw new Exception("Invalid email format.");
            }

            
            if (!empty($data['username']) && $data['username'] !== $existing['username']) {
                if (!preg_match('/^[a-zA-Z0-9_]+$/', $data['username'])) {
                    throw new Exception("Username can only contain letters, numbers and underscore.");
                }
                if ($this->isUsernameTaken($data['username'], $userId)) {
                    throw new Exception("Username already taken.");
                }
                $stmt = $this->db->prepare("UPDATE users SET username = ? WHERE user_id = ?");
                $stmt->bind_param('si', $data['username'], $userId);
                $stmt->execute();
            }

            
            if (!empty($data['password'])) {
                if (strlen($data['password']) < 8) {
                    throw new Exception("Password must be at least 8 characters.");
                }
                $hash = password_hash($data['password'], PASSWORD_DEFAULT);
                $stmt = $this->db->prepare("UPDATE users SET password_hash = ? WHERE user_id = ?");
                $stmt->bind_param('si', $hash, $userId);
                $stmt->execute();
            }

            
            $postalCode = $data['postal_code'] ?? $existing['postal_code'] ?? self::DEFAULT_POSTAL;
            $stmt = $this->db->prepare("UPDATE suppliers SET supplier_name = ?, contact_person = ?, email = ?, phone = ?, street_address = ?, postal_code = ? WHERE supplier_id = ?");
            $stmt->bind_param(
                'ssssssi',
                $data['supplier_name'],
                $data['contact_person'],
                $data['email'],
                $data['phone'],
                $data['street_address'],
                $postalCode,
                $supplierId
            );
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
        $supplierId = (int)$supplierId;
        if ($supplierId <= 0) {
            return false;
        }
        $stmt = $this->db->prepare("UPDATE suppliers SET is_active = 0 WHERE supplier_id = ? AND is_active = 1");
        $stmt->bind_param('i', $supplierId);
        return $stmt->execute() && $stmt->affected_rows > 0;
    }
}
