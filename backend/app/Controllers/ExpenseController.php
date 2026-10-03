<?php
// record, update, delete, and filter expenses.
namespace App\Controllers;

use App\Models\Expense;

class ExpenseController
{
    private $expenseModel;

    public function __construct()
    {
        $this->expenseModel = new Expense();
    }

    public function addExpense($data)
    {
        return $this->expenseModel->addExpense(
            $data['amount'] ?? null,
            $data['category_id'] ?? null,
            $data['additional_description'] ?? '',
            $data['payment_method_id'] ?? null,
            $data['supplier_id'] ?? null,
            $data['reference_code'] ?? ''
        );
    }

    public function getExpenseCategories()
    {
        return $this->expenseModel->getExpenseCategories();
    }

    public function getAllExpenses($data)
    {
        return $this->expenseModel->fetchAllExpenses(
            $data['search'] ?? '',
            $data['category'] ?? '',
            $data['startDate'] ?? '',
            $data['endDate'] ?? ''
        );
    }

    public function getPaymentMethods()
    {
        return $this->expenseModel->getPaymentMethods();
    }
}
