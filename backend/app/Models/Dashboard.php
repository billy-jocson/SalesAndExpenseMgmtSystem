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

    public function getChartData($startDate, $endDate)
    {
        $formattedStart = (new \DateTimeImmutable($startDate))->format('Y-m-d');
        $formattedEnd = (new \DateTimeImmutable($endDate))->format('Y-m-d');

        $stmt = $this->db->prepare("SELECT 
            ec.category_name as category_name, 
            CAST(COALESCE(SUM(e.amount), 0.00) AS DECIMAL(10,2)) AS total_amount
            FROM expense_categories ec
            LEFT JOIN expenses e ON ec.category_id = e.category_id 
                AND DATE(e.expense_date) BETWEEN ? AND ?
            GROUP BY ec.category_id, ec.category_name
            ORDER BY ec.category_name ASC");
        $stmt->bind_param('ss', $formattedStart, $formattedEnd);
       
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        return array_map(function($row) {
            return [
                'category_name' => $row['category_name'],
                'total_amount' => (float) $row['total_amount']
            ];
        }, $rows);
    }
    public function getLineChartData($startDate, $endDate)
    {
        
        $formattedStart = (new \DateTimeImmutable($startDate))->format('Y-m-d');
        $formattedEnd = (new \DateTimeImmutable($endDate))->format('Y-m-d');

        $stmt = $this->db->prepare("SELECT 
                date_list.entry_date AS _date,
                CAST(COALESCE(SUM(date_list.sales), 0.00) AS DECIMAL(10,2)) AS sales,
                CAST(COALESCE(SUM(date_list.expense), 0.00) AS DECIMAL(10,2)) AS expense
            FROM (
                SELECT 
                    DATE(s.sale_date) AS entry_date, 
                    (SUM(si.quantity * si.unit_price) + s.tax_amount) AS sales, 
                    0.00 AS expense 
                FROM sales s
                LEFT JOIN sales_items si ON s.sale_id = si.sale_id
                WHERE DATE(s.sale_date) BETWEEN ? AND ?
                GROUP BY s.sale_id, DATE(s.sale_date), s.tax_amount
                
                UNION ALL
                
                SELECT 
                    DATE(e.expense_date) AS entry_date, 
                    0.00 AS sales, 
                    e.amount AS expense 
                FROM expenses e
                WHERE DATE(e.expense_date) BETWEEN ? AND ?
            ) AS date_list
            GROUP BY date_list.entry_date
            ORDER BY date_list.entry_date ASC;");

        $stmt->bind_param('ssss', $formattedStart, $formattedEnd, $formattedStart, $formattedEnd);
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        

        // Explicitly parse strings to floats for Recharts compatibility
        return array_map(function ($row) {
            return [
                '_date' => $row['_date'],
                'sales' => (float) $row['sales'],
                'expense' => (float) $row['expense'],
            ];
        }, $rows);
    }

    public function getTotalProductsCardAnalytics($supplierId)
    {
        $CurrentSupplierId = $supplierId;

        $stmt = $this->db->prepare("SELECT 
                (
                    SELECT COUNT(*) 
                    FROM supplier_products 
                    WHERE supplier_id = ?
                ) AS totalProducts,
                (
                    SELECT COALESCE(SUM(si.quantity * si.unit_price), 0.00)
                    FROM sales_items si
                    JOIN store_products sp ON si.store_product_id = sp.store_product_id
                    JOIN supplier_products sup_p ON sp.supplier_product_id = sup_p.supplier_product_id
                    WHERE sup_p.supplier_id = ?
                ) AS totalRevenue;");
        $stmt->bind_param('ii', $CurrentSupplierId, $CurrentSupplierId);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc() ?: [];

        $tempTotalProducts = (int) ($result['totalProducts'] ?? 0);
        $tempTotalRevenue = (float) ($result['totalRevenue'] ?? 0.00);

        return [
            'totalProducts' => $tempTotalProducts,
            'totalRevenue' => $tempTotalRevenue,
        ];
    }
}
