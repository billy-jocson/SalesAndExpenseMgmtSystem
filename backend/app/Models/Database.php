<?php
namespace App\Models;

use mysqli;
use mysqli_sql_exception;

class Database {
    private $host = 'localhost';
    private $dbname = 'inventory_system';
    private $username = 'root';
    private $password = '';
    private $conn = null;

    public function getConnection() {
        if ($this->conn === null) {
            try {
                mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
                $this->conn = new mysqli(
                    $this->host,
                    $this->username,
                    $this->password,
                    $this->dbname
                );
                $this->conn->set_charset('utf8mb4');
            } catch (mysqli_sql_exception $e) {
                // Log error or output JSON response
                http_response_code(500);
                echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
                exit();
            }
        }

        return $this->conn;
    }
}
?>