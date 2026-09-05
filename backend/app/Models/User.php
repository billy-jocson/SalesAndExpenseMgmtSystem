<?php
namespace App\Models;

use mysqli;

class User {
    private $db;

    public function __construct(mysqli $db = null) {
        $this->db = $db ?? (new Database())->getConnection();
    }

    public function findByUsername($username) {
        $stmt = $this->db->prepare("SELECT * FROM users WHERE username = ? LIMIT 1");
        $stmt->bind_param('s', $username);
        $stmt->execute();

        $result = $stmt->get_result();
        return $result->fetch_assoc() ?: null;
    }
}
?>