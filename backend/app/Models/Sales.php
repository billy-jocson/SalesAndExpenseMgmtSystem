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
    public function processCheckout($userId, $paymentMethodId, $referenceNumber, $taxAmount, $amount, $items)
    {
        $this->db->begin_transaction();

        try {
            // 1. Resolve staff_id from the requesting user_id
            $stmt = $this->db->prepare("SELECT staff_id FROM staffs WHERE user_id = ?");
            $stmt->bind_param('i', $userId);
            $stmt->execute();
            $result = $stmt->get_result();
            $staff = $result->fetch_assoc();

            if (!$staff) {
                throw new \Exception("Authorized staff record not found.");
            }
            $staffId = $staff['staff_id'];

            // Lock the latest sale while deriving the next regular transaction number.
            $stmt = $this->db->prepare("SELECT sale_id FROM sales ORDER BY sale_id DESC LIMIT 1 FOR UPDATE");
            $stmt->execute();
            $latestSale = $stmt->get_result()->fetch_assoc();
            $nextTransactionId = ((int) ($latestSale['sale_id'] ?? 0)) + 1;

            // GCash transactions keep their reference code as the transaction number.
            if ($paymentMethodId === 2 && !empty($referenceNumber)) {
                $txnNumber = 'GCASH-' . $referenceNumber;
            } else {
                $txnNumber = 'TXN-' . $nextTransactionId . '-' . date('Y');
            }

            // 3. Insert core sale record
            $stmt = $this->db->prepare("INSERT INTO sales (staff_id, payment_method_id, transaction_number, tax_amount, amount) VALUES (?, ?, ?, ?, ?)");
            $stmt->bind_param('iisdd', $staffId, $paymentMethodId, $txnNumber, $taxAmount, $amount);
            $stmt->execute();
            $saleId = $stmt->insert_id;

            // 4. Process each item and apply FIFO (First-In, First-Out) physical batch deduction
            foreach ($items as $item) {
                $storeProductId = (int) $item['id'];
                $qty = (int) $item['quantity'];
                $price = (float) $item['price'];

                // Insert receipt item
                $stmtItem = $this->db->prepare("INSERT INTO sales_items (sale_id, store_product_id, quantity, unit_price) VALUES (?, ?, ?, ?)");
                $stmtItem->bind_param('iiid', $saleId, $storeProductId, $qty, $price);
                $stmtItem->execute();

                // Get batches ordered by expiration then received date
                $stmtBatch = $this->db->prepare("SELECT batch_id, quantity_in_stock FROM product_batches WHERE store_product_id = ? AND quantity_in_stock > 0 ORDER BY expiration_date ASC, received_date ASC");
                $stmtBatch->bind_param('i', $storeProductId);
                $stmtBatch->execute();
                $batches = $stmtBatch->get_result()->fetch_all(MYSQLI_ASSOC);

                $remainingQty = $qty;

                foreach ($batches as $batch) {
                    if ($remainingQty <= 0) break;

                    // Deduct mathematically from each oldest batch until fulfilled
                    $deduct = min($remainingQty, $batch['quantity_in_stock']);
                    $remainingQty -= $deduct;

                    $stmtUpdate = $this->db->prepare("UPDATE product_batches SET quantity_in_stock = quantity_in_stock - ? WHERE batch_id = ?");
                    $stmtUpdate->bind_param('ii', $deduct, $batch['batch_id']);
                    $stmtUpdate->execute();
                }

                if ($remainingQty > 0) {
                    throw new \Exception("Insufficient physical stock for product ID {$storeProductId}.");
                }
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
        } catch (\Exception $e) {
            $this->db->rollback();
            return [
                'status' => 'Error',
                'message' => $e->getMessage()
            ];
        }
    }
}
