<?php

namespace App\Models;

use mysqli;

class Dashboard
{
    private $db;

    public function __construct(mysqli $db = null)
    {
        $this->db = $db ?? (new Database())->getConnection();
    }

    public function getDashboardCardAnalytics($startDate, $endDate)
    {
        $start = new \DateTimeImmutable($startDate);
        $end = new \DateTimeImmutable($endDate);
        $days = $start->diff($end)->days + 1;
        $previousEnd = $start->modify('-1 day')->format('Y-m-d');
        $previousStart = $start->modify("-{$days} days")->format('Y-m-d');

        $stmt = $this->db->prepare("SELECT
            COALESCE(SUM(CASE WHEN DATE(sale_date) BETWEEN ? AND ? THEN total_amount ELSE 0 END), 0.00) AS current_sales,
            COALESCE(SUM(CASE WHEN DATE(sale_date) BETWEEN ? AND ? THEN total_amount ELSE 0 END), 0.00) AS previous_sales
            FROM vw_sales_summary");
        $stmt->bind_param('ssss', $startDate, $endDate, $previousStart, $previousEnd);
        $stmt->execute();
        $sales = $stmt->get_result()->fetch_assoc() ?: [];

        $stmt = $this->db->prepare("SELECT
            COALESCE(SUM(CASE WHEN DATE(expense_date) BETWEEN ? AND ? THEN amount ELSE 0 END), 0.00) AS current_expenses,
            COALESCE(SUM(CASE WHEN DATE(expense_date) BETWEEN ? AND ? THEN amount ELSE 0 END), 0.00) AS previous_expenses
            FROM expenses");
        $stmt->bind_param('ssss', $startDate, $endDate, $previousStart, $previousEnd);
        $stmt->execute();
        $expenses = $stmt->get_result()->fetch_assoc() ?: [];

        $currentSales = (float) ($sales['current_sales'] ?? 0);
        $previousSales = (float) ($sales['previous_sales'] ?? 0);
        $currentExpenses = (float) ($expenses['current_expenses'] ?? 0);
        $previousExpenses = (float) ($expenses['previous_expenses'] ?? 0);

        return [
            'sales' => $currentSales,
            'previousSales' => $previousSales,
            'expenses' => $currentExpenses,
            'previousExpenses' => $previousExpenses,
            'netIncome' => $currentSales - $currentExpenses,
            'previousNetIncome' => $previousSales - $previousExpenses,
        ];
    }

    public function getChartData()
    {
        $stmt = $this->db->prepare("SELECT 
        ec.category_name as category_name, 
        COALESCE(SUM(e.amount), 0.00) AS total_amount
        FROM expense_categories ec
        LEFT JOIN expenses e ON ec.category_id = e.category_id
        GROUP BY ec.category_id, ec.category_name
        ORDER BY ec.category_name ASC");
        $stmt->execute();

        $result = $stmt->get_result();
        return $result->fetch_all(MYSQLI_ASSOC);
    }
}
