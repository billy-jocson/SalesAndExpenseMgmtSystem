<?php

namespace App\Models;

use mysqli;

class Expense
{
    private $db;

    public function __construct(mysqli $db = null)
    {
        $this->db = $db ?? (new Database())->getConnection();
    }

    public function addExpense(
        $amount,
        $category_id,
        $additional_description,
        $payment_method_id,
        $supplier_id,
        $reference_code
    ) {
        $stmt = $this->db->prepare("CALL sp_add_expense(?, ?, ?, ?, ?, ?)");
        $stmt->bind_param('disiis', $amount, $category_id, $additional_description, $payment_method_id, $supplier_id, $reference_code);
        $stmt->execute();
    }

    public function getExpenseCategories()
    {
        $stmt = $this->db->prepare("SELECT * FROM expense_categories");
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_all(MYSQLI_ASSOC);
    }

    public function fetchAllExpenses($search = "", $category = "", $startDate = "", $endDate = "")
    {
        $query = "SELECT ec.category_name, 
            e.additional_description, 
            COALESCE(e.amount, 0.00) as amount, 
            pm.method_name, 
            COALESCE(e.reference_code, 'N/A') as refcode,
            e.expense_date
            FROM expenses e 
            LEFT JOIN expense_categories ec USING(category_id)
            LEFT JOIN payment_methods pm USING(payment_method_id)";

        $conditions = [];
        $params = [];
        $types = "";

        if ($search !== "") {
            $searchTerm = "%{$search}%";
            $conditions[] = "(e.additional_description LIKE ? OR ec.category_name LIKE ?)";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $types .= "ss";
        }

        if ($category !== "") {
            $conditions[] = "e.category_id = ?";
            $params[] = (int) $category;
            $types .= "i";
        }

        if ($startDate !== "" && $endDate !== "") {
            $conditions[] = "DATE(e.expense_date) BETWEEN ? AND ?";
            $params[] = $startDate;
            $params[] = $endDate;
            $types .= "ss";
        }

        if ($conditions) {
            $query .= " WHERE " . implode(" AND ", $conditions);
        }

        $stmt = $this->db->prepare($query);

        if ($params) {
            $stmt->bind_param($types, ...$params);
        }

        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_all(MYSQLI_ASSOC);
    }

    public function getPaymentMethods()
    {
        $stmt = $this->db->prepare("SELECT * FROM payment_methods");
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_all(MYSQLI_ASSOC);
    }
}
