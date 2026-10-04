<?php

namespace App\Models;

use mysqli;

class Sales
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

    public function fetchAllSales($search = "", $startDate = "", $endDate = "")
    {
        $searchParam = $search ?? '';
        $startParam = $startDate ?? '';
        $endParam = $endDate ?? '';

        $stmt = $this->db->prepare("CALL sp_sales_fetch_all(?, ?, ?)");
        $stmt->bind_param('sss', $searchParam, $startParam, $endParam);
        $stmt->execute();
        $result = $stmt->get_result();
        $sales = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
        $this->clearResults();
        $stmt->close();

        foreach ($sales as &$sale) {
            $sale['items'] = ($sale['items'] === null || $sale['items'] === '') ? [] : array_map(
                static function ($item) {
                    $parts = explode('||', $item);
                    return [
                        'name' => $parts[0] ?? '',
                        'unitPrice' => $parts[1] ?? 0,
                        'quantity' => $parts[2] ?? 0,
                        'subtotal' => $parts[3] ?? 0,
                    ];
                },
                explode(';;', $sale['items'])
            );
        }

        return $sales;
    }

    public function processCheckout($userId, $paymentMethodId, $referenceNumber, $taxAmount, $amount, $items)
    {
        $this->db->begin_transaction();

        try {
            // 1. Gumawa ng Core Sale record gamit ang Stored Procedure
            $stmt = $this->db->prepare("CALL sp_sales_create(?, ?, ?, ?, ?)");
            $stmt->bind_param('iisdd', $userId, $paymentMethodId, $referenceNumber, $taxAmount, $amount);
            $stmt->execute();
            $result = $stmt->get_result();
            $sale = $result ? $result->fetch_assoc() : null;
            $this->clearResults();
            $stmt->close();

            if (!$sale || empty($sale['sale_id'])) {
                throw new \Exception("Failed to generate transaction record.");
            }

            $saleId = (int)$sale['sale_id'];
            $txnNumber = $sale['transaction_number'];

            // 2. I-record ang bawat sales item at ibawas sa batches via FIFO Stored Procedure
            foreach ($items as $item) {
                $storeProductId = (int)($item['id'] ?? $item['store_product_id']);
                $qty = (int)$item['quantity'];
                $price = (float)$item['price'];

                $stmtItem = $this->db->prepare("CALL sp_sales_add_item_with_fifo(?, ?, ?, ?)");
                $stmtItem->bind_param('iiid', $saleId, $storeProductId, $qty, $price);
                
                if (!$stmtItem->execute()) {
                    throw new \Exception("Failed to deduct batch stock for product ID {$storeProductId}.");
                }
                
                $this->clearResults();
                $stmtItem->close();
            }

            $this->db->commit();

            return [
                'status' => 'Success',
                'message' => 'Transaction processed successfully.',
                'transaction' => [
                    'sale_id' => $saleId,
                    'transaction_number' => $txnNumber
                ]
            ];
        } catch (\Throwable $e) {
            $this->db->rollback();
            return [
                'status' => 'Error',
                'message' => $e->getMessage()
            ];
        }
    }
}