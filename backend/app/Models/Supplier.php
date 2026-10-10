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

    private function clearResults()
    {
        while ($this->db->more_results() && $this->db->next_result()) {
            if ($result = $this->db->store_result()) {
                $result->free();
            }
        }
    }

    public function fetchSuppliers($search = '')
    {
        $stmt = $this->db->prepare("CALL sp_suppliers_fetch(?)");
        $stmt->bind_param('s', $search);
        $stmt->execute();
        $result = $stmt->get_result();
        $data = $result->fetch_all(MYSQLI_ASSOC);
        $this->clearResults();
        $stmt->close();
        return $data;
    }

    public function addSupplier($data = [])
    {
        $username = trim((string) ($data['username'] ?? ''));
        $password = (string) ($data['password'] ?? '');
        $supplierName = trim((string) ($data['supplier_name'] ?? ''));

        if ($username === '' || $password === '' || $supplierName === '') {
            throw new RuntimeException('Supplier name, username, and password are required.');
        }

        $roleId = $this->getSupplierRoleId();
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);

        $contactPerson = $data['contact_person'] ?? null;
        $email = $data['email'] ?? null;
        $phone = $data['phone'] ?? null;
        $streetAddress = $data['street_address'] ?? null;
        $postalCode = $data['postal_code'] ?? null;

        $stmt = $this->db->prepare("CALL sp_suppliers_add(?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param(
            'ssssssssi',
            $username,
            $passwordHash,
            $supplierName,
            $contactPerson,
            $email,
            $phone,
            $streetAddress,
            $postalCode,
            $roleId
        );

        try {
            $stmt->execute();
            $result = $stmt->get_result()->fetch_assoc();
            $this->clearResults();
            $stmt->close();

            return [
                'status' => 'Success',
                'message' => 'Supplier added successfully.',
                'supplier_id' => $result['supplier_id'] ?? $this->db->insert_id,
            ];
        } catch (\mysqli_sql_exception $e) {
            $this->clearResults();
            $stmt->close();
            if (strpos($e->getMessage(), 'Username already exists') !== false) {
                throw new RuntimeException('Username already exists.');
            }
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

        $supplierUserId = $this->getSupplierUserId($supplierId);
        if ($supplierUserId <= 0) {
            throw new RuntimeException('Supplier user not found.');
        }

        $newUsername = trim((string) ($data['username'] ?? ''));
        $newPassword = (string) ($data['password'] ?? '');
        $passwordHash = $newPassword !== '' ? password_hash($newPassword, PASSWORD_DEFAULT) : null;

        $contactPerson = $data['contact_person'] ?? null;
        $email = $data['email'] ?? null;
        $phone = $data['phone'] ?? null;
        $streetAddress = $data['street_address'] ?? null;
        $postalCode = $data['postal_code'] ?? null;

        $stmt = $this->db->prepare("CALL sp_suppliers_update(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param(
            'iissssssss',
            $supplierId,
            $supplierUserId,
            $newUsername,
            $passwordHash,
            $supplierName,
            $contactPerson,
            $email,
            $phone,
            $streetAddress,
            $postalCode
        );

        try {
            $stmt->execute();
            $this->clearResults();
            $stmt->close();

            return [
                'status' => 'Success',
                'message' => 'Supplier updated successfully.'
            ];
        } catch (\mysqli_sql_exception $e) {
            $this->clearResults();
            $stmt->close();
            if (strpos($e->getMessage(), 'Username already exists') !== false) {
                throw new RuntimeException('Username already exists.');
            }
            throw $e;
        }
    }

    public function fetchPostalCodes($search = '')
    {
        $stmt = $this->db->prepare("CALL sp_postal_codes_fetch(?)");
        $stmt->bind_param('s', $search);
        $stmt->execute();
        $result = $stmt->get_result();
        $data = $result->fetch_all(MYSQLI_ASSOC);
        $this->clearResults();
        $stmt->close();
        return $data;
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

        $stmt = $this->db->prepare("CALL sp_postal_codes_add(?, ?, ?, ?)");
        $stmt->bind_param('ssss', $postalCode, $city, $state, $country);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        $this->clearResults();
        $stmt->close();

        if (($result['status'] ?? '') === 'exists') {
            return ['status' => 'Success', 'message' => 'Postal code already exists.'];
        }

        return ['status' => 'Success', 'message' => 'Postal code added successfully.'];
    }

    public function softDelete($supplierId)
    {
        $stmt = $this->db->prepare("CALL sp_suppliers_soft_delete(?)");
        $stmt->bind_param('i', $supplierId);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        $this->clearResults();
        $stmt->close();

        return ($result['affected_rows'] ?? 0) > 0;
    }

    private function getSupplierRoleId()
    {
        $stmt = $this->db->prepare("CALL sp_roles_get_supplier_role_id()");
        $stmt->execute();
        $result = $stmt->get_result();
        $role = $result->fetch_assoc();
        $this->clearResults();
        $stmt->close();

        if (!$role) {
            throw new RuntimeException('Supplier role is not available.');
        }

        return (int) $role['role_id'];
    }

    private function getSupplierUserId($supplierId)
    {
        $stmt = $this->db->prepare("CALL sp_suppliers_get_user_id(?)");
        $stmt->bind_param('i', $supplierId);
        $stmt->execute();
        $result = $stmt->get_result();
        $supplier = $result->fetch_assoc();
        $this->clearResults();
        $stmt->close();

        return $supplier ? (int) $supplier['user_id'] : 0;
    }
}
