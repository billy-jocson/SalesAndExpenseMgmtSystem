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

    private function clearResults()
    {
        while ($this->db->more_results() && $this->db->next_result()) {
            if ($result = $this->db->store_result()) {
                $result->free();
            }
        }
    }

    public function addExpense(
    $amount,
    $category_id,
    $additional_description,
    $payment_method_id,
    $supplier_id,
    $reference_code
) {
    $reference_code = trim((string) $reference_code);

    if (!is_numeric($amount) || (float) $amount <= 0) {
        throw new \RuntimeException('Amount must be greater than 0.');
    }
    if ((int) $category_id <= 0) {
        throw new \RuntimeException('Expense category is required.');
    }
    if ((int) $payment_method_id <= 0) {
        throw new \RuntimeException('Payment method is required.');
    }

    foreach ($this->getPaymentMethods() as $method) {
        if ((int) $method['payment_method_id'] === (int) $payment_method_id
            && strtolower($method['method_name']) === 'gcash'
            && $reference_code === '') {
            throw new \RuntimeException('GCash reference code is required.');
        }
    }

    $amount = (float) $amount;
    $category_id = (int) $category_id;
    $payment_method_id = (int) $payment_method_id;
    $supplier_id = !empty($supplier_id) ? (int) $supplier_id : null;

    $stmt = $this->db->prepare("CALL sp_add_expense(?, ?, ?, ?, ?, ?)");
    $stmt->bind_param(
        'disiis',
        $amount,
        $category_id,
        $additional_description,
        $payment_method_id,
        $supplier_id,
        $reference_code
    );
    $result = $stmt->execute();
    $this->clearResults();
    $stmt->close();

    if (!$result) {
        throw new \RuntimeException('Unable to add expense.');
    }

    return [
        'status' => 'Success',
        'message' => 'Expense added successfully.'
    ];
}

    public function getExpenseCategories()
    {
        $stmt = $this->db->prepare("CALL sp_expense_categories_get()");
        $stmt->execute();
        $result = $stmt->get_result();
        $data = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
        $this->clearResults();
        $stmt->close();

        return $data;
    }

    public function fetchAllExpenses($search = "", $category = "", $startDate = "", $endDate = "")
    {
        $categoryId = !empty($category) ? (int)$category : 0;
        $searchParam = $search ?? '';
        $startParam = $startDate ?? '';
        $endParam = $endDate ?? '';

        $stmt = $this->db->prepare("CALL sp_expenses_fetch_all(?, ?, ?, ?)");
        $stmt->bind_param('siss', $searchParam, $categoryId, $startParam, $endParam);
        $stmt->execute();
        $result = $stmt->get_result();
        $data = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
        $this->clearResults();
        $stmt->close();

        return $data;
    }

    public function getPaymentMethods()
    {
        $stmt = $this->db->prepare("CALL sp_payment_methods_get()");
        $stmt->execute();
        $result = $stmt->get_result();
        $data = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
        $this->clearResults();
        $stmt->close();

        return $data;
    }
}
