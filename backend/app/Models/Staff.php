<?php

namespace App\Models;

use mysqli;
use Exception;

class Staff
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

    public function getStaffRoles(): array
    {
        $stmt = $this->db->prepare("CALL sp_staff_roles_get()");
        $stmt->execute();
        $result = $stmt->get_result();
        $roles = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
        $this->clearResults();
        $stmt->close();

        return $roles;
    }

    public function fetchStaffs(string $search = ""): array
    {
        $stmt = $this->db->prepare("CALL sp_staff_fetch_all(?)");
        $stmt->bind_param("s", $search);
        $stmt->execute();
        $result = $stmt->get_result();
        $staffs = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
        $this->clearResults();
        $stmt->close();

        return $staffs;
    }

    public function getStaffById(int $staffId): ?array
    {
        $stmt = $this->db->prepare("CALL sp_staff_get_by_id(?)");
        $stmt->bind_param("i", $staffId);
        $stmt->execute();
        $result = $stmt->get_result();
        $staff = $result ? $result->fetch_assoc() : null;
        $this->clearResults();
        $stmt->close();

        return $staff ?: null;
    }

    public function deleteStaff(int $staffId): bool
    {
        $stmt = $this->db->prepare("CALL sp_staff_soft_delete(?)");
        $stmt->bind_param("i", $staffId);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result ? $result->fetch_assoc() : [];
        $this->clearResults();
        $stmt->close();

        return ($row['affected_rows'] ?? 0) > 0;
    }

    public function createStaff(array $data): array
    {
        $this->validateCreateData($data);

        $firstName = trim($data['first_name']);
        $middleName = trim($data['middle_name'] ?? '');
        $lastName = trim($data['last_name']);
        $email = trim($data['email'] ?? '');
        $phone = trim($data['phone'] ?? '');
        $hireDate = !empty($data['hire_date']) ? trim($data['hire_date']) : null;
        $username = trim($data['username']);
        $password = (string) $data['password'];
        $roleName = trim($data['role_name']);

        $passwordHash = password_hash($password, PASSWORD_DEFAULT);

        try {
            $stmt = $this->db->prepare("CALL sp_staff_create(?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->bind_param(
                "sssssssss",
                $firstName,
                $middleName,
                $lastName,
                $email,
                $phone,
                $hireDate,
                $username,
                $passwordHash,
                $roleName
            );
            $stmt->execute();
            $result = $stmt->get_result();
            $newStaff = $result ? $result->fetch_assoc() : null;
            $this->clearResults();
            $stmt->close();

            if (!$newStaff) {
                throw new Exception("Failed to create staff member.");
            }

            return $newStaff;
        } catch (Exception $e) {
            $this->clearResults();
            throw $e;
        }
    }

    public function updateStaff(array $data): array
    {
        $staffId = (int) ($data['staff_id'] ?? 0);
        $firstName = trim((string) ($data['first_name'] ?? ''));
        $middleName = trim((string) ($data['middle_name'] ?? ''));
        $lastName = trim((string) ($data['last_name'] ?? ''));
        $email = trim((string) ($data['email'] ?? ''));
        $phone = trim((string) ($data['phone'] ?? ''));
        $hireDate = !empty($data['hire_date']) ? trim((string) $data['hire_date']) : null;
        $username = trim((string) ($data['username'] ?? ''));
        $password = (string) ($data['password'] ?? '');
        $roleName = trim((string) ($data['role_name'] ?? ''));

        if ($staffId <= 0 || $firstName === '' || $lastName === '' || $username === '' || $roleName === '') {
            throw new Exception("Staff ID, first name, last name, username, and role are required");
        }
        if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new Exception("Invalid email format");
        }
        if ($password !== '' && strlen($password) < 6) {
            throw new Exception("Password must be at least 6 characters");
        }

        $passwordHash = $password !== '' ? password_hash($password, PASSWORD_DEFAULT) : '';

        try {
            $stmt = $this->db->prepare("CALL sp_staff_update(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->bind_param(
                "isssssssss",
                $staffId,
                $firstName,
                $middleName,
                $lastName,
                $email,
                $phone,
                $hireDate,
                $username,
                $passwordHash,
                $roleName
            );
            $stmt->execute();
            $result = $stmt->get_result();
            $updatedStaff = $result ? $result->fetch_assoc() : null;
            $this->clearResults();
            $stmt->close();

            if (!$updatedStaff) {
                throw new Exception("Updated staff member could not be loaded");
            }

            return $updatedStaff;
        } catch (Exception $e) {
            $this->clearResults();
            throw $e;
        }
    }

    private function validateCreateData(array $data): void
    {
        if (empty($data['first_name']) || empty($data['last_name'])) {
            throw new Exception("First name and last name are required");
        }
        if (empty($data['username'])) {
            throw new Exception("Username is required");
        }
        if (empty($data['password'])) {
            throw new Exception("Password is required");
        }
        if (strlen($data['password']) < 6) {
            throw new Exception("Password must be at least 6 characters");
        }
        if (empty($data['role_name'])) {
            throw new Exception("Role is required");
        }
        if (!empty($data['email']) && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            throw new Exception("Invalid email format");
        }
    }
}
