<?php
// create sales and retrieve sales history.

namespace App\Controllers;

use App\Models\Sales;

class SalesController
{
    private $salesModel;

    public function __construct()
    {
        $this->salesModel = new Sales();
    }

    public function getAllSales($data)
    {
        return $this->salesModel->fetchAllSales(
            $data['search'] ?? '',
            $data['startDate'] ?? '',
            $data['endDate'] ?? ''
        );
    }
}
