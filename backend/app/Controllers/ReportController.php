<?php

namespace App\Controllers;

use App\Models\Report;

class ReportController
{
    private $reportModel;

    public function __construct()
    {
        $this->reportModel = new Report();
    }

    public function getSummary($data)
    {
        $startDate = trim((string) ($data['startDate'] ?? ''));
        $endDate = trim((string) ($data['endDate'] ?? ''));

        if (!$this->isValidDate($startDate) || !$this->isValidDate($endDate) || $startDate > $endDate) {
            return [
                'status' => 'error',
                'message' => 'A valid date range is required.',
            ];
        }

        return [
            'status' => 'success',
            'message' => 'Report data fetched successfully.',
            'data' => $this->reportModel->getSummary($startDate, $endDate),
        ];
    }

    private function isValidDate($value)
    {
        $date = \DateTime::createFromFormat('Y-m-d', (string) $value);
        return $date && $date->format('Y-m-d') === $value;
    }
}
