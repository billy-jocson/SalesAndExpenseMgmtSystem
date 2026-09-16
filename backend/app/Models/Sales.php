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

    public function fetchAllSales($search = "", $startDate = "", $endDate = "")
    {
        $query = "SELECT
            s.sale_id,
            s.transaction_number,
            CONCAT(st.first_name, ' ', st.last_name) AS staff_name,
            s.sale_date,
            COALESCE(SUM(si.quantity * si.unit_price), 0.00) AS total_amount,
            GROUP_CONCAT(
                CONCAT_WS('||', sp.product_name, si.unit_price, si.quantity, si.quantity * si.unit_price)
                SEPARATOR ';;'
            ) AS items
            FROM sales s
            LEFT JOIN staffs st ON st.staff_id = s.staff_id
            LEFT JOIN sales_items si ON si.sale_id = s.sale_id
            LEFT JOIN store_products stp ON stp.store_product_id = si.store_product_id
            LEFT JOIN supplier_products sp ON sp.supplier_product_id = stp.supplier_product_id";

        $conditions = [];
        $params = [];
        $types = "";

        if ($search !== "") {
            $searchTerm = "%{$search}%";
            $conditions[] = "(
                s.transaction_number LIKE ?
                OR CONCAT(st.first_name, ' ', st.last_name) LIKE ?
                OR sp.product_name LIKE ?
                OR DATE_FORMAT(s.sale_date, '%Y-%m-%d') LIKE ?
            )";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $types .= "ssss";
        }

        if ($startDate !== "" && $endDate !== "") {
            $conditions[] = "DATE(s.sale_date) BETWEEN ? AND ?";
            $params[] = $startDate;
            $params[] = $endDate;
            $types .= "ss";
        }

        if ($conditions) {
            $query .= " WHERE " . implode(" AND ", $conditions);
        }

        $query .= " GROUP BY s.sale_id, s.transaction_number, st.first_name, st.last_name, s.sale_date ORDER BY s.sale_date DESC";
        $stmt = $this->db->prepare($query);

        if ($params) {
            $stmt->bind_param($types, ...$params);
        }

        $stmt->execute();
        $result = $stmt->get_result();
        $sales = $result->fetch_all(MYSQLI_ASSOC);

        foreach ($sales as &$sale) {
            $sale['items'] = $sale['items'] === null ? [] : array_map(
                static function ($item) {
                    [$name, $unitPrice, $quantity, $subtotal] = explode('||', $item);
                    return [
                        'name' => $name,
                        'unitPrice' => $unitPrice,
                        'quantity' => $quantity,
                        'subtotal' => $subtotal,
                    ];
                },
                explode(';;', $sale['items'])
            );
        }

        return $sales;
    }
   
     
    //add ni aljon
    //     public function resolveStaffId($userId)
    // {
    //     $stmt = $this->db->prepare("SELECT staff_id FROM staffs WHERE user_id = ?");
    //     $stmt->bind_param('i', $userId);
    //     $stmt->execute();
    //     $staff = $stmt->get_result()->fetch_assoc();

    //     return $staff ? (int) $staff['staff_id'] : null;
    // }

    // public function createSale($userId, $paymentMethodId, $items, $taxRate = 0.10)
    // {
    //     $staffId = $this->resolveStaffId($userId);

    //     if (!$staffId) {
    //         throw new \RuntimeException('Staff record not found for this user.');
    //     }

    //     if (empty($items)) {
    //         throw new \RuntimeException('Cart is empty.');
    //     }

    //     $this->db->begin_transaction();

    //     try {
    //         // 1. Lock and validate each product's current price + stock
    //         $lineItems = [];
    //         $subtotal = 0.0;

    //         foreach ($items as $item) {
    //             $storeProductId = (int) ($item['store_product_id'] ?? 0);
    //             $quantity = (int) ($item['quantity'] ?? 0);

    //             if ($storeProductId <= 0 || $quantity <= 0) {
    //                 throw new \RuntimeException('Invalid cart item.');
    //             }

    //             $priceStmt = $this->db->prepare(
    //                 "SELECT stp.selling_price, sp.product_name,
    //                     COALESCE(SUM(pb.quantity_in_stock), 0) AS stock
    //                 FROM store_products stp
    //                 JOIN supplier_products sp ON sp.supplier_product_id = stp.supplier_product_id
    //                 LEFT JOIN product_batches pb ON pb.store_product_id = stp.store_product_id
    //                 WHERE stp.store_product_id = ? AND stp.is_active = 1
    //                 GROUP BY stp.store_product_id, stp.selling_price, sp.product_name
    //                 FOR UPDATE"
    //             );
    //             $priceStmt->bind_param('i', $storeProductId);
    //             $priceStmt->execute();
    //             $product = $priceStmt->get_result()->fetch_assoc();

    //             if (!$product) {
    //                 throw new \RuntimeException("Product not found or inactive (id {$storeProductId}).");
    //             }

    //             if ((int) $product['stock'] < $quantity) {
    //                 throw new \RuntimeException("Not enough stock for {$product['product_name']}.");
    //             }

    //             $unitPrice = (float) $product['selling_price'];
    //             $subtotal += $unitPrice * $quantity;

    //             $lineItems[] = [
    //                 'store_product_id' => $storeProductId,
    //                 'quantity' => $quantity,
    //                 'unit_price' => $unitPrice,
    //             ];
    //         }

    //         $taxAmount = round($subtotal * $taxRate, 2);
    //         $transactionNumber = 'TXN-' . date('YmdHis') . '-' . strtoupper(substr(bin2hex(random_bytes(2)), 0, 4));

    //         // 2. Insert the sale header
    //         $saleStmt = $this->db->prepare(
    //             "INSERT INTO sales (staff_id, payment_method_id, transaction_number, tax_amount)
    //             VALUES (?, ?, ?, ?)"
    //         );
    //         $saleStmt->bind_param('iisd', $staffId, $paymentMethodId, $transactionNumber, $taxAmount);
    //         $saleStmt->execute();
    //         $saleId = $this->db->insert_id;

    //         // 3. Insert line items + deduct stock FEFO
    //         $itemStmt = $this->db->prepare(
    //             "INSERT INTO sales_items (sale_id, store_product_id, quantity, unit_price)
    //             VALUES (?, ?, ?, ?)"
    //         );

    //         $batchStmt = $this->db->prepare(
    //             "SELECT batch_id, quantity_in_stock FROM product_batches
    //             WHERE store_product_id = ? AND quantity_in_stock > 0
    //             ORDER BY expiration_date ASC
    //             FOR UPDATE"
    //         );

    //         $deductStmt = $this->db->prepare(
    //             "UPDATE product_batches SET quantity_in_stock = quantity_in_stock - ? WHERE batch_id = ?"
    //         );

    //         foreach ($lineItems as $line) {
    //             $itemStmt->bind_param(
    //                 'iiid',
    //                 $saleId,
    //                 $line['store_product_id'],
    //                 $line['quantity'],
    //                 $line['unit_price']
    //             );
    //             $itemStmt->execute();

    //             $remaining = $line['quantity'];
    //             $batchStmt->bind_param('i', $line['store_product_id']);
    //             $batchStmt->execute();
    //             $batches = $batchStmt->get_result()->fetch_all(MYSQLI_ASSOC);

    //             foreach ($batches as $batch) {
    //                 if ($remaining <= 0) {
    //                     break;
    //                 }

    //                 $take = min($remaining, (int) $batch['quantity_in_stock']);
    //                 $batchId = (int) $batch['batch_id'];
    //                 $deductStmt->bind_param('ii', $take, $batchId);
    //                 $deductStmt->execute();
    //                 $remaining -= $take;
    //             }

    //             if ($remaining > 0) {
    //                 throw new \RuntimeException('Stock changed mid-transaction, please retry.');
    //             }
    //         }

    //         $this->db->commit();

    //         return [
    //             'sale_id' => $saleId,
    //             'transaction_number' => $transactionNumber,
    //             'subtotal' => round($subtotal, 2),
    //             'tax_amount' => $taxAmount,
    //             'total_amount' => round($subtotal + $taxAmount, 2),
    //         ];
    //     } catch (\Throwable $error) {
    //         $this->db->rollback();
    //         throw $error;
    //     }
    // }
}
