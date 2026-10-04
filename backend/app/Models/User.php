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

    private function clearResults(): void
    {
        while ($this->db->more_results() && $this->db->next_result()) {
            if ($result = $this->db->store_result()) {
                $result->free();
            }
        }
    }

    public function findByUsername($username)
    {
        $stmt = $this->db->prepare("CALL sp_users_find_by_username(?)");
        $stmt->bind_param('s', $username);
        $stmt->execute();

        $result = $stmt->get_result();
        $user = $result ? $result->fetch_assoc() : null;

        $this->clearResults();
        $stmt->close();

        return $user ?: null;
    }
}