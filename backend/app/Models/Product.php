<?php

namespace App\Models;

use mysqli;

class Product
{
    private $db;

    public function __construct(mysqli $db = null)
    {
        $this->db = $db ?? (new Database())->getConnection();
    }

    public function getProductCategories()
    {
        $stmt = $this->db->prepare("SELECT category_id, category_name FROM product_categories ORDER BY category_name ASC");
        $stmt->execute();

        $result = $stmt->get_result();
        return $result->fetch_all(MYSQLI_ASSOC);
    }

    public function updateSellingPrice($productId, $sellingPrice, $role = '')
    {
        $column = strtolower(trim($role)) === 'supplier' ? 'wholesale_price' : 'selling_price';
        $table = strtolower(trim($role)) === 'supplier' ? 'supplier_products' : 'store_products';
        $idColumn = strtolower(trim($role)) === 'supplier' ? 'supplier_product_id' : 'store_product_id';
        $stmt = $this->db->prepare("UPDATE {$table} SET {$column} = ? WHERE {$idColumn} = ?");
        $stmt->bind_param('di', $sellingPrice, $productId);

        return $stmt->execute();
    }

    public function softDelete($productId, $role = '')
    {
        $isSupplier = strtolower(trim($role)) === 'supplier';
        $table = $isSupplier ? 'supplier_products' : 'store_products';
        $idColumn = $isSupplier ? 'supplier_product_id' : 'store_product_id';
        $stmt = $this->db->prepare("UPDATE {$table} SET is_active = 0 WHERE {$idColumn} = ?");
        $stmt->bind_param('i', $productId);

        return $stmt->execute();
    }

    public function restock($storeProductId, $quantity, $expirationDate)
    {
        $this->db->begin_transaction();

        try {
            $productStmt = $this->db->prepare("SELECT
                sp.supplier_id,
                sp.wholesale_price
                FROM store_products stp
                JOIN supplier_products sp ON sp.supplier_product_id = stp.supplier_product_id
                WHERE stp.store_product_id = ? AND stp.is_active = 1");
            $productStmt->bind_param('i', $storeProductId);
            $productStmt->execute();
            $product = $productStmt->get_result()->fetch_assoc();

            if (!$product) {
                throw new \RuntimeException('Product not found.');
            }

            $latestBatchStmt = $this->db->prepare("SELECT batch_number FROM product_batches
                WHERE store_product_id = ? ORDER BY batch_id DESC LIMIT 1");
            $latestBatchStmt->bind_param('i', $storeProductId);
            $latestBatchStmt->execute();
            $latestBatch = $latestBatchStmt->get_result()->fetch_assoc();
            $batchNumber = 'BATCH-1-001';

            if ($latestBatch && preg_match('/^BATCH-(\d+)-(\d+)$/', $latestBatch['batch_number'], $matches)) {
                $batchNumber = 'BATCH-' . ((int) $matches[1] + 1) . '-' . $matches[2];
            }

            $unitCost = (float) $product['wholesale_price'];
            $batchStmt = $this->db->prepare("INSERT INTO product_batches
                (store_product_id, batch_number, quantity_in_stock, unit_cost, expiration_date, received_date)
                VALUES (?, ?, ?, ?, ?, CURDATE())");
            $batchStmt->bind_param('isids', $storeProductId, $batchNumber, $quantity, $unitCost, $expirationDate);
            $batchStmt->execute();

            $categoryStmt = $this->db->prepare("SELECT category_id FROM expense_categories WHERE category_name = 'Inventory Purchases' LIMIT 1");
            $categoryStmt->execute();
            $category = $categoryStmt->get_result()->fetch_assoc();

            $paymentStmt = $this->db->prepare("SELECT payment_method_id FROM payment_methods WHERE method_name = 'Cash' LIMIT 1");
            $paymentStmt->execute();
            $payment = $paymentStmt->get_result()->fetch_assoc();

            if (!$category || !$payment) {
                throw new \RuntimeException('Inventory category or Cash payment method is missing.');
            }

            $amount = $quantity * $unitCost;
            $description = "Inventory restock: {$batchNumber}";
            $referenceCode = $batchNumber;
            $inventoryCategoryId = (int) $category['category_id'];
            $supplierId = $product['supplier_id'] === null ? null : (int) $product['supplier_id'];
            $paymentMethodId = (int) $payment['payment_method_id'];
            $expenseStmt = $this->db->prepare("INSERT INTO expenses
                (category_id, supplier_id, payment_method_id, reference_code, amount, additional_description)
                VALUES (?, ?, ?, ?, ?, ?)");
            $expenseStmt->bind_param(
                'iiisds',
                $inventoryCategoryId,
                $supplierId,
                $paymentMethodId,
                $referenceCode,
                $amount,
                $description
            );
            $expenseStmt->execute();

            $this->db->commit();
            return ['amount' => $amount, 'batchNumber' => $batchNumber, 'unitCost' => $unitCost];
        } catch (\Throwable $error) {
            $this->db->rollback();
            throw $error;
        }
    }

    public function getProducts($role = '', $supplierId = null, $search = '', $categoryId = '')
    {
        $isSupplier = strtolower(trim($role)) === 'supplier';
        $searchTerm = "%{$search}%";
        $categoryCondition = $categoryId === '' ? '' : ' AND sp.category_id = ?';

        if ($isSupplier) {
            $stmt = $this->db->prepare("SELECT
                sp.supplier_product_id as id,
                sp.product_name as prodname,
                pc.category_name as category,
                sp.wholesale_price as sellprice,
                0 as stock
                FROM supplier_products sp
                LEFT JOIN product_categories pc ON sp.category_id = pc.category_id
                WHERE sp.supplier_id = ? AND sp.is_active = 1
                    AND (sp.product_name LIKE ? OR pc.category_name LIKE ?){$categoryCondition}
                ORDER BY sp.product_name ASC");
            $supplierId = (int) $supplierId;
            if ($categoryId === '') {
                $stmt->bind_param('iss', $supplierId, $searchTerm, $searchTerm);
            } else {
                $categoryId = (int) $categoryId;
                $stmt->bind_param('issi', $supplierId, $searchTerm, $searchTerm, $categoryId);
            }
        } else {
            $stmt = $this->db->prepare("SELECT
                stp.store_product_id as id,
                sp.product_name as prodname,
                pc.category_name as category,
                s.supplier_name,
                stp.selling_price as sellprice,
                COALESCE(SUM(pb.quantity_in_stock), 0) as stock
                FROM store_products stp
                JOIN supplier_products sp ON sp.supplier_product_id = stp.supplier_product_id
                LEFT JOIN product_categories pc ON sp.category_id = pc.category_id
                LEFT JOIN suppliers s ON sp.supplier_id = s.supplier_id
                LEFT JOIN product_batches pb ON stp.store_product_id = pb.store_product_id
                WHERE stp.is_active = 1 AND sp.is_active = 1
                    AND (sp.product_name LIKE ? OR pc.category_name LIKE ? OR s.supplier_name LIKE ?){$categoryCondition}
                GROUP BY stp.store_product_id, sp.product_name, pc.category_name, s.supplier_name, stp.selling_price
                ORDER BY sp.product_name ASC");
            if ($categoryId === '') {
                $stmt->bind_param('sss', $searchTerm, $searchTerm, $searchTerm);
            } else {
                $categoryId = (int) $categoryId;
                $stmt->bind_param('sssi', $searchTerm, $searchTerm, $searchTerm, $categoryId);
            }
        }

        $stmt->execute();

        $result = $stmt->get_result();
        return $result->fetch_all(MYSQLI_ASSOC);
    }
}
