<?php

namespace App\Models;

use mysqli;

class User
{
    private $db;

    public function __construct(mysqli $db = null)
    {
        $this->db = $db ?? (new Database())->getConnection();
    }

    public function findByUsername($username)
    {
        $stmt = $this->db->prepare("SELECT users.*, roles.role_name,
            staffs.first_name,
            staffs.last_name,
            suppliers.supplier_id,
            suppliers.supplier_name,
            suppliers.contact_person,
            suppliers.email AS supplier_email,
            suppliers.phone AS supplier_phone
        FROM users
        LEFT JOIN roles ON users.role_id = roles.role_id
        LEFT JOIN staffs ON users.user_id = staffs.user_id
        LEFT JOIN suppliers ON users.user_id = suppliers.user_id
        WHERE users.username = ?
        LIMIT 1");
        $stmt->bind_param('s', $username);
        $stmt->execute();

        $result = $stmt->get_result();
        return $result->fetch_assoc() ?: null;
    }
}
