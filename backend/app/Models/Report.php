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

    private function clearResults(): void
    {
        while ($this->db->more_results() && $this->db->next_result()) {
            if ($result = $this->db->store_result()) {
                $result->free();
            }
        }
    }

    public function getSummary($startDate, $endDate)
    {
        $resultSets = $this->callReportProcedure($startDate, $endDate);

        // Result Set 0: Top Products
        $topProducts = $resultSets[0] ?? [];

        // Result Set 1: Expenses by Category
        $expenses = $resultSets[1] ?? [];
        $expenses = array_map(static function ($expense) {
            $expense['total_amount'] = (float) $expense['total_amount'];
            return $expense;
        }, $expenses);

        // Result Set 2: Financial Totals
        $totals = $resultSets[2][0] ?? [];
        $totalSales = (float) ($totals['total_sales'] ?? 0);
        $totalExpenses = (float) ($totals['total_expenses'] ?? 0);

        // Result Set 3: Category Sales Volume
        $productCategories = $resultSets[3] ?? [];
        $productCategories = array_map(static function ($row) {
            $row['total_qty'] = (int) $row['total_qty'];
            return $row;
        }, $productCategories);

        // Result Set 4: Monthly Trend
        $trend = $resultSets[4] ?? [];
        $trend = array_map(static function ($row) {
            $row['total_sales'] = (float) ($row['total_sales'] ?? 0);
            $row['total_expenses'] = (float) ($row['total_expenses'] ?? 0);
            return $row;
        }, $trend);

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

    private function callReportProcedure($startDate, $endDate): array
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

        $this->clearResults();
        $stmt->close();

        return $resultSets;
    }
}
