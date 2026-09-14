<?php

namespace App\Models;

use mysqli;

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

    public function softDelete($supplierId)
    {
        $stmt = $this->db->prepare("UPDATE suppliers SET is_active = 0 WHERE supplier_id = ? AND is_active = 1");
        $stmt->bind_param('i', $supplierId);

        return $stmt->execute() && $stmt->affected_rows > 0;
    }
}
