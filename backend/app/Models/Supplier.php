<?php

namespace App\Models;

use mysqli;
use RuntimeException;

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
        $stmt = $this->db->prepare("SELECT * FROM suppliers
            WHERE is_active = 1 AND (supplier_name LIKE ? OR contact_person LIKE ? OR email LIKE ?
            OR phone LIKE ? OR street_address LIKE ?)");
        $stmt->bind_param('sssss', $searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm);
        $stmt->execute();

        $result = $stmt->get_result();
        return $result->fetch_all(MYSQLI_ASSOC);
    }

    public function addSupplier($data = [])
    {
        $username = trim((string) ($data['username'] ?? ''));
        $password = (string) ($data['password'] ?? '');
        $supplierName = trim((string) ($data['supplier_name'] ?? ''));

        if ($username === '' || $password === '' || $supplierName === '') {
            throw new RuntimeException('Supplier name, username, and password are required.');
        }

        $existingUser = $this->db->prepare("SELECT user_id FROM users WHERE username = ? LIMIT 1");
        $existingUser->bind_param('s', $username);
        $existingUser->execute();
        $existingUserResult = $existingUser->get_result();

        if ($existingUserResult->num_rows > 0) {
            throw new RuntimeException('Username already exists.');
        }

        $roleId = $this->getSupplierRoleId();

        $this->db->begin_transaction();
        try {
            $passwordHash = password_hash($password, PASSWORD_DEFAULT);
            $userStmt = $this->db->prepare("INSERT INTO users (role_id, username, password_hash, is_active) VALUES (?, ?, ?, 1)");
            $userStmt->bind_param('iss', $roleId, $username, $passwordHash);
            $userStmt->execute();

            $userId = $this->db->insert_id;
            $contactPerson = $data['contact_person'] ?? null;
            $email = $data['email'] ?? null;
            $phone = $data['phone'] ?? null;
            $streetAddress = $data['street_address'] ?? null;
            $postalCode = $data['postal_code'] ?? null;

            $supplierStmt = $this->db->prepare("INSERT INTO suppliers (user_id, supplier_name, contact_person, email, phone, street_address, postal_code, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1)");
            $supplierStmt->bind_param(
                'issssss',
                $userId,
                $supplierName,
                $contactPerson,
                $email,
                $phone,
                $streetAddress,
                $postalCode
            );
            $supplierStmt->execute();

            $this->db->commit();
            return [
                'status' => 'Success',
                'message' => 'Supplier added successfully.',
                'supplier_id' => $this->db->insert_id,
            ];
        } catch (\Throwable $e) {
            $this->db->rollback();
            throw $e;
        }
    }

    public function updateSupplier($data = [])
    {
        $supplierId = (int) ($data['supplier_id'] ?? 0);
        $supplierName = trim((string) ($data['supplier_name'] ?? ''));

        if ($supplierId <= 0 || $supplierName === '') {
            throw new RuntimeException('A valid supplier and name are required.');
        }

        $this->db->begin_transaction();
        try {
            $newUsername = trim((string) ($data['username'] ?? ''));
            $newPassword = (string) ($data['password'] ?? '');

            $supplierUserId = $this->getSupplierUserId($supplierId);

            if ($newUsername !== '') {
                $checkStmt = $this->db->prepare("SELECT user_id FROM users WHERE username = ? AND user_id != ? LIMIT 1");
                $checkStmt->bind_param('si', $newUsername, $supplierUserId);
                $checkStmt->execute();
                $duplicate = $checkStmt->get_result();

                if ($duplicate->num_rows > 0) {
                    throw new RuntimeException('Username already exists.');
                }

                $userStmt = $this->db->prepare("UPDATE users SET username = ? WHERE user_id = ?");
                $userStmt->bind_param('si', $newUsername, $supplierUserId);
                $userStmt->execute();
            }

            if ($newPassword !== '') {
                $passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);
                $passwordStmt = $this->db->prepare("UPDATE users SET password_hash = ? WHERE user_id = ?");
                $passwordStmt->bind_param('si', $passwordHash, $supplierUserId);
                $passwordStmt->execute();
            }

            $contactPerson = $data['contact_person'] ?? null;
            $email = $data['email'] ?? null;
            $phone = $data['phone'] ?? null;
            $streetAddress = $data['street_address'] ?? null;
            $postalCode = $data['postal_code'] ?? null;

            $updateStmt = $this->db->prepare("UPDATE suppliers SET supplier_name = ?, contact_person = ?, email = ?, phone = ?, street_address = ?, postal_code = ? WHERE supplier_id = ? AND is_active = 1");
            $updateStmt->bind_param(
                'ssssssi',
                $supplierName,
                $contactPerson,
                $email,
                $phone,
                $streetAddress,
                $postalCode,
                $supplierId
            );
            $updateStmt->execute();

            $this->db->commit();
            return [
                'status' => 'Success',
                'message' => 'Supplier updated successfully.'
            ];
        } catch (\Throwable $e) {
            $this->db->rollback();
            throw $e;
        }
    }

    public function fetchPostalCodes($search = '')
    {
        $query = "SELECT postal_code, city, state, country FROM postal_codes";
        $params = [];
        $types = '';

        if ($search !== '') {
            $query .= " WHERE postal_code LIKE ? OR city LIKE ? OR state LIKE ? OR country LIKE ?";
            $searchTerm = "%{$search}%";
            $params = [$searchTerm, $searchTerm, $searchTerm, $searchTerm];
            $types = 'ssss';
        }

        $query .= " ORDER BY postal_code ASC LIMIT 100";

        $stmt = $this->db->prepare($query);

        if ($params) {
            $stmt->bind_param($types, ...$params);
        }

        $stmt->execute();
        $result = $stmt->get_result();

        return $result->fetch_all(MYSQLI_ASSOC);
    }

    public function addPostalCode($data = [])
    {
        $postalCode = strtoupper(trim((string) ($data['postal_code'] ?? '')));
        $city = trim((string) ($data['city'] ?? ''));
        $state = trim((string) ($data['state'] ?? ''));
        $country = trim((string) ($data['country'] ?? ''));

        if ($postalCode === '' || $city === '' || $state === '' || $country === '') {
            throw new RuntimeException('Postal code, city, state, and country are required.');
        }

        $checkStmt = $this->db->prepare("SELECT postal_code FROM postal_codes WHERE postal_code = ? LIMIT 1");
        $checkStmt->bind_param('s', $postalCode);
        $checkStmt->execute();

        if ($checkStmt->get_result()->num_rows > 0) {
            return ['status' => 'Success', 'message' => 'Postal code already exists.'];
        }

        $insertStmt = $this->db->prepare("INSERT INTO postal_codes (postal_code, city, state, country) VALUES (?, ?, ?, ?)");
        $insertStmt->bind_param('ssss', $postalCode, $city, $state, $country);
        $insertStmt->execute();

        return ['status' => 'Success', 'message' => 'Postal code added successfully.'];
    }

    public function softDelete($supplierId)
    {
        $stmt = $this->db->prepare("UPDATE suppliers SET is_active = 0 WHERE supplier_id = ? AND is_active = 1");
        $stmt->bind_param('i', $supplierId);

        return $stmt->execute() && $stmt->affected_rows > 0;
    }

    private function getSupplierRoleId()
    {
        $stmt = $this->db->prepare("SELECT role_id FROM roles WHERE LOWER(role_name) = 'supplier' LIMIT 1");
        $stmt->execute();
        $result = $stmt->get_result();
        $role = $result->fetch_assoc();

        if (!$role) {
            throw new RuntimeException('Supplier role is not available.');
        }

        return (int) $role['role_id'];
    }

    private function getSupplierUserId($supplierId)
    {
        $stmt = $this->db->prepare("SELECT user_id FROM suppliers WHERE supplier_id = ? LIMIT 1");
        $stmt->bind_param('i', $supplierId);
        $stmt->execute();
        $result = $stmt->get_result();
        $supplier = $result->fetch_assoc();

        return $supplier ? (int) $supplier['user_id'] : 0;
    }
}
