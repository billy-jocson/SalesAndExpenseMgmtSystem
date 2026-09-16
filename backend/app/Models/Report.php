<?php

namespace App\Models;

use mysqli;

class Report
{
    private $db;

    public function __construct(mysqli $db = null)
    {
        $this->db = $db ?? (new Database())->getConnection();
    }

    public function getSummary($startDate, $endDate)
    {
        $resultSets = $this->callReportProcedure($startDate, $endDate);
        $topProducts = $resultSets[0] ?? [];
        $expenses = $resultSets[1] ?? [];
        $totals = $resultSets[2][0] ?? [];
        $productCategories = $this->getProductCategorySales($startDate, $endDate);
        $trend = $this->getMonthlyRevenueAndExpenses($startDate, $endDate);

        $totalSales = (float) ($totals['total_sales'] ?? 0);
        $totalExpenses = (float) ($totals['total_expenses'] ?? 0);

        return [
            'totals' => [
                'sales' => $totalSales,
                'expenses' => $totalExpenses,
                'profitLoss' => $totalSales - $totalExpenses,
            ],
            'topProducts' => $topProducts,
            'productCategories' => $productCategories,
            'expenses' => $expenses,
            'trend' => $trend,
        ];
    }

    private function getProductCategorySales($startDate, $endDate)
    {//eto ung nadagdag na query
        $rows = $this->queryAll(
            "SELECT
                pc.category_name AS category_name,
                COALESCE(SUM(si.quantity), 0) AS total_qty
            FROM sales_items si
            JOIN sales s ON s.sale_id = si.sale_id
            JOIN store_products stp ON stp.store_product_id = si.store_product_id
            JOIN supplier_products sp ON sp.supplier_product_id = stp.supplier_product_id
            JOIN product_categories pc ON pc.category_id = sp.category_id
            WHERE DATE(s.sale_date) BETWEEN ? AND ?
            GROUP BY pc.category_id, pc.category_name
            ORDER BY total_qty DESC",
            'ss',
            [$startDate, $endDate]
        );

        return array_map(static function ($row) {
            $row['total_qty'] = (int) $row['total_qty'];
            return $row;
        }, $rows);
    }

    private function getMonthlyRevenueAndExpenses($startDate, $endDate)
    {// also this 
        return $this->queryAll(
            "SELECT
                report_month,
                SUM(total_sales) AS total_sales,
                SUM(total_expenses) AS total_expenses
            FROM (
                SELECT
                    DATE_FORMAT(sale_date, '%Y-%m') AS report_month,
                    SUM(total_amount) AS total_sales,
                    0.00 AS total_expenses
                FROM vw_sales_summary
                WHERE DATE(sale_date) BETWEEN ? AND ?
                GROUP BY DATE_FORMAT(sale_date, '%Y-%m')

                UNION ALL

                SELECT
                    DATE_FORMAT(expense_date, '%Y-%m') AS report_month,
                    0.00 AS total_sales,
                    SUM(amount) AS total_expenses
                FROM expenses
                WHERE DATE(expense_date) BETWEEN ? AND ?
                GROUP BY DATE_FORMAT(expense_date, '%Y-%m')
            ) monthly_data
            GROUP BY report_month
            ORDER BY report_month ASC",
            'ssss',
            [$startDate, $endDate, $startDate, $endDate]
        );
    }

    private function queryAll($sql, $types, $values)
    {
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param($types, ...$values);
        $stmt->execute();
        $result = $stmt->get_result();
        $rows = $result->fetch_all(MYSQLI_ASSOC);
        $result->free();
        $stmt->close();
        return $rows;
    }

    private function callReportProcedure($startDate, $endDate)
    {
        $stmt = $this->db->prepare('CALL sp_generate_reports_summary(?, ?)');
        $stmt->bind_param('ss', $startDate, $endDate);
        $stmt->execute();

        $resultSets = [];
        do {
            $result = $stmt->get_result();
            if ($result instanceof \mysqli_result) {
                $resultSets[] = $result->fetch_all(MYSQLI_ASSOC);
                $result->free();
            } else {
                $resultSets[] = [];
            }
        } while ($stmt->more_results() && $stmt->next_result());

        $stmt->close();
        return $resultSets;
    }
}
