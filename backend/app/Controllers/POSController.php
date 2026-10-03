<?php

namespace App\Controllers;

use App\Models\Sales;

class POSController
{
    private $salesModel;

    public function __construct()
    {
        $this->salesModel = new Sales();
    }

    public function checkout($data)
    {
        // 1. Validate payload requirements
        if (empty($data['items']) || !is_array($data['items'])) {
            return ['status' => 'Error', 'message' => 'Cart is empty or invalid.'];
        }
        if (empty($data['user_id'])) {
            return ['status' => 'Error', 'message' => 'User authentication ID is missing.'];
        }
        if (empty($data['payment_method_id'])) {
            return ['status' => 'Error', 'message' => 'Payment method is required.'];
        }

        // 2. Prepare parameters
        $userId = (int)$data['user_id'];
        $paymentMethodId = (int)$data['payment_method_id'];

        // We still accept reference number from the React frontend payload
        $referenceNumber = $data['reference_number'] ?? null;

        $taxAmount = (float)($data['tax_amount'] ?? 0);
        $items = $data['items'];
        $amount = $data['amount'];

        // 3. Process database insertion and batch deduction
        return $this->salesModel->processCheckout($userId, $paymentMethodId, $referenceNumber, $taxAmount, $amount, $items);
    }
}
