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

    public function getChartAnalytics($data)
    {
        if (empty($data['startDate']) || empty($data['endDate'])) {
            return [
                'status' => 'error',
                'message' => 'Date range is required.'
            ];
        }

        $responsedata = $this->dashboardModel->getChartData(
            $data['startDate'],
            $data['endDate']
        );



        if (!empty($responsedata)) {
            return [
                'status' => 'success',
                'message' => 'Chart data fetched successfully!',
                'data' => $responsedata,
            ];
        }

        return [
            'status' => 'error',
            'message' => 'No expense data available for this range.'
        ];
    }
    public function getLineChartData($data)
    {
        if (empty($data['startDate']) || empty($data['endDate'])) {
            return [
                'status' => 'error',
                'message' => 'Date range is required.'
            ];
        }

        $responsedata = $this->dashboardModel->getLineChartData(
            $data['startDate'],
            $data['endDate']
        );


        if (!empty($responsedata)) {
            return [
                'status' => 'success',
                'message' => 'Line chart data fetched successfully!',
                'data' => $responsedata,
            ];
        }
        return [
            'status' => 'error',
            'message' => 'No line chart data available.'
        ];
    }

    public function getTotalProductCardData($data)
    {

        if (empty($data['supplierId'])) {
            return [
                'status' => 'error',
                'message' => 'Supplier ID is required.'
            ];
        }

        $reponsedata = $this->dashboardModel->getTotalProductsCardAnalytics(
            $data['supplierId']
        );

        if ($reponsedata) {
            return [
                'status' => 'success',
                'message' => 'Card data fetched successfully!',
                'data' => [
                    'totalProducts' => $reponsedata['totalProducts'],
                    'totalRevenue' => $reponsedata['totalRevenue'],
                ]
            ];
        }

        return [
            'status' => 'error',
            'message' => 'Failed to fetch card data.'
        ];
    }
}
