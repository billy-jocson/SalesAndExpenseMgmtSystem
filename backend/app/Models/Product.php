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

    private function clearResults()
    {
        while ($this->db->more_results() && $this->db->next_result()) {
            if ($result = $this->db->store_result()) {
                $result->free();
            }
        }
    }

    public function getProductCategories()
    {
        $stmt = $this->db->prepare("CALL sp_product_categories_get()");
        $stmt->execute();
        $result = $stmt->get_result();
        $data = $result->fetch_all(MYSQLI_ASSOC);
        $this->clearResults();
        $stmt->close();
        return $data;
    }

    public function updateSellingPrice($productId, $sellingPrice, $role = '')
    {
        $stmt = $this->db->prepare("CALL sp_products_update_selling_price(?, ?, ?)");
        $stmt->bind_param('ids', $productId, $sellingPrice, $role);
        $result = $stmt->execute();
        $this->clearResults();
        $stmt->close();
        return $result;
    }

    private function replaceProductCategories($supplierProductId, $categoryIds)
    {
        $deleteStmt = $this->db->prepare("DELETE FROM supplier_product_categories WHERE supplier_product_id = ?");
        $deleteStmt->bind_param('i', $supplierProductId);
        $deleteStmt->execute();
        $deleteStmt->close();

        $insertStmt = $this->db->prepare("INSERT INTO supplier_product_categories (supplier_product_id, category_id) VALUES (?, ?)");
        foreach ($categoryIds as $categoryId) {
            $categoryId = (int) $categoryId;
            $insertStmt->bind_param('ii', $supplierProductId, $categoryId);
            $insertStmt->execute();
        }
        $insertStmt->close();
    }

    public function addProduct($supplierId, $categoryIds, $productName, $description, $wholesalePrice, $files = [])
    {
        $imagePath = '/uploads/products/default-product.png';

        if (!empty($files['image']['name'])) {
            $allowed = ['jpg', 'jpeg', 'png', 'webp'];
            $fileName = basename($files['image']['name']);
            $extension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

            if (!in_array($extension, $allowed, true)) {
                throw new \RuntimeException('Only JPG, JPEG, PNG, and WEBP images are allowed.');
            }

            $uploadDir = __DIR__ . '/../../public/uploads/products';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            $finalName = 'product_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $extension;
            $targetPath = $uploadDir . '/' . $finalName;

            if (!move_uploaded_file($files['image']['tmp_name'], $targetPath)) {
                throw new \RuntimeException('Image upload failed.');
            }

            $imagePath = '/uploads/products/' . $finalName;
        }

        $primaryCategoryId = (int) $categoryIds[0];
        $this->db->begin_transaction();
        try {
            $stmt = $this->db->prepare("CALL sp_supplier_products_add(?, ?, ?, ?, ?, ?)");
            $stmt->bind_param('iisssd', $supplierId, $primaryCategoryId, $productName, $description, $imagePath, $wholesalePrice);
            $stmt->execute();
            $data = $stmt->get_result()->fetch_assoc();
            $this->clearResults();
            $stmt->close();

            if (!$data || empty($data['supplier_product_id'])) {
                throw new \RuntimeException('Product could not be created.');
            }

            $this->replaceProductCategories((int) $data['supplier_product_id'], $categoryIds);
            $this->db->commit();
            return true;
        } catch (\Throwable $error) {
            $this->db->rollback();
            throw $error;
        }
    }

    public function updateProduct($productId, $categoryIds, $productName, $description, $wholesalePrice, $files = [], $role = '')
    {
        // Validate required fields early (same as original)
        if (empty($productId) || empty($productName) || empty($categoryIds) || $wholesalePrice === '' || $wholesalePrice === null) {
            throw new \RuntimeException('Product id, name, category, and price are required.');
        }

        $isSupplier = strtolower(trim($role)) === 'supplier';

        // Get current image path via procedure
        $currentStmt = $this->db->prepare("CALL sp_products_get_image_path(?, ?)");
        $currentStmt->bind_param('is', $productId, $role);
        $currentStmt->execute();
        $currentProduct = $currentStmt->get_result()->fetch_assoc();
        $this->clearResults();
        $currentStmt->close();

        $imagePath = $currentProduct['image_path'] ?? '/uploads/products/default-product.png';

        if (!empty($files['image']['name'])) {
            $allowed = ['jpg', 'jpeg', 'png', 'webp'];
            $fileName = basename($files['image']['name']);
            $extension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

            if (!in_array($extension, $allowed, true)) {
                throw new \RuntimeException('Only JPG, JPEG, PNG, and WEBP images are allowed.');
            }

            $uploadDir = __DIR__ . '/../../public/uploads/products';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            $finalName = 'product_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $extension;
            $targetPath = $uploadDir . '/' . $finalName;

            if (!move_uploaded_file($files['image']['tmp_name'], $targetPath)) {
                throw new \RuntimeException('Image upload failed.');
            }

            $imagePath = '/uploads/products/' . $finalName;
        }

        $primaryCategoryId = (int) $categoryIds[0];
        $this->db->begin_transaction();
        try {
            $stmt = $this->db->prepare("CALL sp_products_update(?, ?, ?, ?, ?, ?, ?)");
            $stmt->bind_param('iisssds', $productId, $primaryCategoryId, $productName, $description, $imagePath, $wholesalePrice, $role);
            $result = $stmt->execute();
            $this->clearResults();
            $stmt->close();
            if (!$result) {
                throw new \RuntimeException('Product could not be updated.');
            }

            $this->replaceProductCategories($productId, $categoryIds);
            $this->db->commit();
            return true;
        } catch (\Throwable $error) {
            $this->db->rollback();
            throw $error;
        }
    }

    public function softDelete($productId, $role = '')
    {
        $stmt = $this->db->prepare("CALL sp_products_soft_delete(?, ?)");
        $stmt->bind_param('is', $productId, $role);
        $result = $stmt->execute();
        $this->clearResults();
        $stmt->close();
        return $result;
    }

    public function ensureStoreProduct($supplierProductId, $sellingPrice = null)
    {
        $supplierProductId = (int) $supplierProductId;
        $sellingPriceParam = $sellingPrice === null ? null : (float) $sellingPrice;

        $stmt = $this->db->prepare("CALL sp_products_ensure_store_product(?, ?)");
        $stmt->bind_param('id', $supplierProductId, $sellingPriceParam);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        $this->clearResults();
        $stmt->close();

        if (!$result) {
            throw new \RuntimeException('Supplier product not found.');
        }

        return (int) $result['store_product_id'];
    }

    public function restock($storeProductId, $quantity, $expirationDate, $paymentMethod = 'Cash', $referenceCode = '')
    {
        $stmt = $this->db->prepare("CALL sp_products_restock(?, ?, ?, ?, ?)");
        $stmt->bind_param('iisss', $storeProductId, $quantity, $expirationDate, $paymentMethod, $referenceCode);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        $this->clearResults();
        $stmt->close();

        if (!$result) {
            throw new \RuntimeException('Restock failed.');
        }

        return ['amount' => $result['amount'], 'batchNumber' => $result['batchNumber'], 'unitCost' => $result['unitCost']];
    }

    public function getExpiryProducts()
    {
        $stmt = $this->db->prepare("CALL sp_products_expiry_get()");
        $stmt->execute();
        $result = $stmt->get_result();
        $data = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
        $this->clearResults();
        $stmt->close();

        return $data;
    }

    public function getProducts($role = '', $supplierId = null, $search = '', $categoryId = '', $isAll = false)
    {
        $categoryIdsParam = is_array($categoryId) ? implode(',', $categoryId) : (string) $categoryId;
        $supplierIdParam = $supplierId === null ? 0 : (int) $supplierId;
        $isAllParam = $isAll ? 1 : 0;
        $roleParam = $role ?? '';
        $searchParam = $search ?? '';

        $stmt = $this->db->prepare("CALL sp_products_get(?, ?, ?, ?, ?)");
        $stmt->bind_param('sissi', $roleParam, $supplierIdParam, $searchParam, $categoryIdsParam, $isAllParam);
        $stmt->execute();
        $result = $stmt->get_result();
        $data = $result->fetch_all(MYSQLI_ASSOC);
        foreach ($data as &$product) {
            $product['category_ids'] = $product['category_ids'] ?? '';
        }
        unset($product);
        $this->clearResults();
        $stmt->close();

        return $data;
    }
}
