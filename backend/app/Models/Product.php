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

    public function addProduct($supplierId, $categoryId, $productName, $description, $wholesalePrice, $files = [])
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

        $stmt = $this->db->prepare("CALL sp_supplier_products_add(?, ?, ?, ?, ?, ?)");
        $stmt->bind_param('iisssd', $supplierId, $categoryId, $productName, $description, $imagePath, $wholesalePrice);
        $stmt->execute();
        $res = $stmt->get_result();
        $data = $res ? $res->fetch_assoc() : null;
        $this->clearResults();
        $stmt->close();

        return $data !== null || $this->db->affected_rows >= 0;
    }

    public function updateProduct($productId, $categoryId, $productName, $description, $wholesalePrice, $files = [], $role = '')
    {
        // Validate required fields early (same as original)
        if (empty($productId) || empty($productName) || empty($categoryId) || $wholesalePrice === '' || $wholesalePrice === null) {
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

        $stmt = $this->db->prepare("CALL sp_products_update(?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param('iisssds', $productId, $categoryId, $productName, $description, $imagePath, $wholesalePrice, $role);

        $result = $stmt->execute();
        $this->clearResults();
        $stmt->close();
        return $result;
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
        $categoryIdParam = $categoryId === '' ? 0 : (int) $categoryId;
        $supplierIdParam = $supplierId === null ? 0 : (int) $supplierId;
        $isAllParam = $isAll ? 1 : 0;
        $roleParam = $role ?? '';
        $searchParam = $search ?? '';

        $stmt = $this->db->prepare("CALL sp_products_get(?, ?, ?, ?, ?)");
        $stmt->bind_param('sissi', $roleParam, $supplierIdParam, $searchParam, $categoryIdParam, $isAllParam);
        $stmt->execute();
        $result = $stmt->get_result();
        $data = $result->fetch_all(MYSQLI_ASSOC);
        $this->clearResults();
        $stmt->close();

        return $data;
    }
}