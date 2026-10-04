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

    private function clearResults()
    {
        while ($this->db->more_results() && $this->db->next_result()) {
            if ($result = $this->db->store_result()) {
                $result->free();
            }
        }
    }

    public function getDashboardCardAnalytics($startDate, $endDate)
    {
        $formattedStart = (new \DateTimeImmutable($startDate))->format('Y-m-d');
        $formattedEnd = (new \DateTimeImmutable($endDate))->format('Y-m-d');

        $stmt = $this->db->prepare("CALL sp_dashboard_card_analytics(?, ?)");
        $stmt->bind_param('ss', $formattedStart, $formattedEnd);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc() ?: [];
        $this->clearResults();
        $stmt->close();

        $currentSales = (float) ($row['current_sales'] ?? 0);
        $previousSales = (float) ($row['previous_sales'] ?? 0);
        $currentExpenses = (float) ($row['current_expenses'] ?? 0);
        $previousExpenses = (float) ($row['previous_expenses'] ?? 0);

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

        $stmt = $this->db->prepare("CALL sp_dashboard_chart_data(?, ?)");
        $stmt->bind_param('ss', $formattedStart, $formattedEnd);
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $this->clearResults();
        $stmt->close();

        return array_map(function ($row) {
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

        $stmt = $this->db->prepare("CALL sp_dashboard_line_chart_data(?, ?)");
        $stmt->bind_param('ss', $formattedStart, $formattedEnd);
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $this->clearResults();
        $stmt->close();

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
        $stmt = $this->db->prepare("CALL sp_dashboard_supplier_card_analytics(?)");
        $stmt->bind_param('i', $supplierId);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc() ?: [];
        $this->clearResults();
        $stmt->close();

        return [
            'totalProducts' => (int) ($result['totalProducts'] ?? 0),
            'totalRevenue' => (float) ($result['totalRevenue'] ?? 0.00),
        ];
    }

    public function getSupplierChartData($startDate, $endDate, $supplierId)
    {
        $formattedStart = (new \DateTimeImmutable($startDate))->format('Y-m-d');
        $formattedEnd = (new \DateTimeImmutable($endDate))->format('Y-m-d');

        $stmt = $this->db->prepare("CALL sp_dashboard_supplier_chart_data(?, ?, ?)");
        $stmt->bind_param('ssi', $formattedStart, $formattedEnd, $supplierId);
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $this->clearResults();
        $stmt->close();

        return array_map(function ($row) {
            return [
                'category_name' => $row['category_name'],
                'total_amount' => (int) $row['product_count'],
            ];
        }, $rows);
    }

    public function getSupplierLineChartData($startDate, $endDate, $supplierId = null)
    {
        $formattedStart = (new \DateTimeImmutable($startDate))->format('Y-m-d');
        $formattedEnd = (new \DateTimeImmutable($endDate))->format('Y-m-d');

        $stmt = $this->db->prepare("CALL sp_dashboard_supplier_line_chart_data(?, ?, ?)");
        $stmt->bind_param('ssi', $formattedStart, $formattedEnd, $supplierId);
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $this->clearResults();
        $stmt->close();

        return array_map(function ($row) {
            return [
                '_date' => $row['_date'],
                'sales' => (float) $row['total_amount'],
            ];
        }, $rows);
    }
}
