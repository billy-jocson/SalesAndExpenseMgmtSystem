<?php

namespace App\Controllers;

use App\Models\Dashboard;

class DashboardController
{
    private $dashboardModel;

    public function __construct()
    {
        $this->dashboardModel = new Dashboard();
    }

    public function getDashboardCardData($data)
    {
        if (empty($data['startDate']) || empty($data['endDate'])) {
            return [
                'status' => 'error',
                'message' => 'Date range is required.'
            ];
        }

        $data = $this->dashboardModel->getDashboardCardAnalytics(
            $data['startDate'],
            $data['endDate']
        );

        if ($data) {
            $percentage = static function ($current, $previous) {
                if ($previous == 0) {
                    return $current == 0 ? 0 : 100;
                }

                return round((($current - $previous) / abs($previous)) * 100, 2);
            };

            return [
                'status' => 'success',
                'message' => 'Card data fetched successfully!',
                'data' => [
                    'sales' => $data['sales'],
                    'expenses' => $data['expenses'],
                    'netIncome' => $data['netIncome'],
                    'salesStatus' => $percentage($data['sales'], $data['previousSales']),
                    'expensesStatus' => $percentage($data['expenses'], $data['previousExpenses']),
                    'netIncomeStatus' => $percentage($data['netIncome'], $data['previousNetIncome'])
                ]
            ];
        }

        return [
            'status' => 'error',
            'message' => 'Invalid username or password.'
        ];
    }

    public function getChartAnalytics()
    {
        $data = $this->dashboardModel->getChartData();

        if (!empty($data)) {
            return [
                'status' => 'success',
                'message' => 'Chart data fetched successfully!',
                'data' => $data
            ];
        }

        return [
            'status' => 'error',
            'message' => 'No chart data available.'
        ];
    }
}
