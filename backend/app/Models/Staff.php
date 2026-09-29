<?php

namespace App\Models;

use mysqli;
use Exception;

class Staff
{
    private $db;
    private const DEFAULT_ROLE = 'cashier staff';

    public function __construct(mysqli $db = null)
    {
        $this->db = $db ?? (new Database())->getConnection();
    }

    private function getRoleIdByName(string $roleName): int
    {
        $stmt = $this->db->prepare("SELECT role_id FROM roles WHERE role_name = ? LIMIT 1");
        $stmt->bind_param("s", $roleName);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($row = $result->fetch_assoc()) {
            return (int)$row['role_id'];
        }
        throw new Exception("Role not found: " . $roleName);
    }

    public function getStaffRoles(): array
    {

        $result = $this->db->query("SELECT role_id, role_name FROM roles WHERE role_name != 'supplier' ORDER BY role_name ASC");
        return $result->fetch_all(MYSQLI_ASSOC);
    }

    public function isUsernameTaken(string $username): bool
    {
        $stmt = $this->db->prepare("SELECT 1 FROM users WHERE username = ? LIMIT 1");
        $stmt->bind_param("s", $username);
        $stmt->execute();
        return $stmt->get_result()->num_rows > 0;
    }

    public function isEmailTaken(string $email): bool
    {
        if (empty($email)) return false;
        $stmt = $this->db->prepare("SELECT 1 FROM staffs WHERE email = ? LIMIT 1");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        return $stmt->get_result()->num_rows > 0;
    }

    public function fetchStaffs(string $search = ""): array
    {
        $searchLike = "%" . $search . "%";
        $sql = "SELECT s.staff_id, s.user_id, s.first_name, s.middle_name, s.last_name, 
                       s.email, s.phone, s.hire_date, s.created_at,
                       u.username, u.is_active, u.role_id, r.role_name
                FROM staffs s
                JOIN users u ON s.user_id = u.user_id
                JOIN roles r ON u.role_id = r.role_id
                WHERE u.is_active = 1
                AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.email LIKE ? OR u.username LIKE ? OR r.role_name LIKE ?)
                ORDER BY s.staff_id DESC LIMIT 100";

        $stmt = $this->db->prepare($sql);
        $stmt->bind_param("sssss", $searchLike, $searchLike, $searchLike, $searchLike, $searchLike);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_all(MYSQLI_ASSOC);
    }

    public function getStaffById(int $staffId): ?array
    {
        $stmt = $this->db->prepare("SELECT s.staff_id, s.user_id, s.first_name, s.middle_name, s.last_name, 
                                           s.email, s.phone, s.hire_date, s.created_at,
                                           u.username, u.is_active, u.role_id, r.role_name
                                    FROM staffs s
                                    JOIN users u ON s.user_id = u.user_id
                                    JOIN roles r ON u.role_id = r.role_id
                                    WHERE s.staff_id = ? LIMIT 1");
        $stmt->bind_param("i", $staffId);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_assoc() ?: null;
    }

    public function deleteStaff(int $staffId): bool
    {
        $stmt = $this->db->prepare(
            "UPDATE users u
             JOIN staffs s ON s.user_id = u.user_id
             SET u.is_active = 0
             WHERE s.staff_id = ?
             AND u.is_active = 1"
        );
        $stmt->bind_param("i", $staffId);
        $stmt->execute();

        return $stmt->affected_rows > 0;
    }

    public function updateStaff(array $data): array
    {
        $staffId = (int) ($data['staff_id'] ?? 0);
        $firstName = trim((string) ($data['first_name'] ?? ''));
        $middleName = trim((string) ($data['middle_name'] ?? ''));
        $lastName = trim((string) ($data['last_name'] ?? ''));
        $email = trim((string) ($data['email'] ?? ''));
        $phone = trim((string) ($data['phone'] ?? ''));
        $hireDate = trim((string) ($data['hire_date'] ?? '')) ?: null;
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

        $staffStmt = $this->db->prepare("SELECT user_id FROM staffs WHERE staff_id = ? LIMIT 1");
        $staffStmt->bind_param("i", $staffId);
        $staffStmt->execute();
        $staff = $staffStmt->get_result()->fetch_assoc();
        if (!$staff) {
            throw new Exception("Staff member not found");
        }
        $userId = (int) $staff['user_id'];

        $usernameStmt = $this->db->prepare("SELECT 1 FROM users WHERE username = ? AND user_id != ? LIMIT 1");
        $usernameStmt->bind_param("si", $username, $userId);
        $usernameStmt->execute();
        if ($usernameStmt->get_result()->num_rows > 0) {
            throw new Exception("Username already exists");
        }

        if ($email !== '') {
            $emailStmt = $this->db->prepare("SELECT 1 FROM staffs WHERE email = ? AND staff_id != ? LIMIT 1");
            $emailStmt->bind_param("si", $email, $staffId);
            $emailStmt->execute();
            if ($emailStmt->get_result()->num_rows > 0) {
                throw new Exception("Email already exists");
            }
        }

        $roleId = $this->getRoleIdByName($roleName);
        $this->db->begin_transaction();
        try {
            $staffUpdate = $this->db->prepare(
                "UPDATE staffs
                 SET first_name = ?, middle_name = ?, last_name = ?, email = ?, phone = ?, hire_date = ?
                 WHERE staff_id = ?"
            );
            $staffUpdate->bind_param(
                "ssssssi",
                $firstName,
                $middleName,
                $lastName,
                $email,
                $phone,
                $hireDate,
                $staffId
            );
            $staffUpdate->execute();

            $userUpdate = $this->db->prepare("UPDATE users SET username = ?, role_id = ? WHERE user_id = ?");
            $userUpdate->bind_param("sii", $username, $roleId, $userId);
            $userUpdate->execute();

            if ($password !== '') {
                $passwordHash = password_hash($password, PASSWORD_DEFAULT);
                $passwordUpdate = $this->db->prepare("UPDATE users SET password_hash = ? WHERE user_id = ?");
                $passwordUpdate->bind_param("si", $passwordHash, $userId);
                $passwordUpdate->execute();
            }

            $this->db->commit();
        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }

        return $this->getStaffById($staffId) ?? throw new Exception("Updated staff member could not be loaded");
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

    public function createStaff(array $data): array
    {
        $this->validateCreateData($data);

        $firstName = trim($data['first_name']);
        $middleName = trim($data['middle_name'] ?? '');
        $lastName = trim($data['last_name']);
        $email = trim($data['email'] ?? '');
        $phone = trim($data['phone'] ?? '');
        $hireDate = $data['hire_date'] ?? null;
        $username = trim($data['username']);
        $password = $data['password'];
        $roleName = trim($data['role_name']);

        if ($this->isUsernameTaken($username)) {
            throw new Exception("Username already exists");
        }
        if (!empty($email) && $this->isEmailTaken($email)) {
            throw new Exception("Email already exists");
        }


        $roleId = $this->getRoleIdByName($roleName);
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);

        $this->db->begin_transaction();
        try {

            $stmtUser = $this->db->prepare("INSERT INTO users (username, password_hash, role_id, is_active) VALUES (?, ?, ?, 1)");
            $stmtUser->bind_param("ssi", $username, $passwordHash, $roleId);
            $stmtUser->execute();
            $userId = $this->db->insert_id;

            if (!$userId) {
                throw new Exception("Failed to create user account");
            }


            $stmtStaff = $this->db->prepare("INSERT INTO staffs (user_id, first_name, middle_name, last_name, email, phone, hire_date) VALUES (?, ?, ?, ?, ?, ?, ?)");

            if (empty($hireDate)) $hireDate = null;
            $stmtStaff->bind_param("issssss", $userId, $firstName, $middleName, $lastName, $email, $phone, $hireDate);
            $stmtStaff->execute();
            $staffId = $this->db->insert_id;

            $this->db->commit();

            return $this->getStaffById($staffId);
        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }
}
