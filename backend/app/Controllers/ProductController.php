<?php

namespace App\Controllers;

use App\Models\Product;

class ProductController
{
    private $productModel;

    public function __construct()
    {
        $this->productModel = new Product();
    }

    public function getCategories()
    {
        $categories = $this->productModel->getProductCategories();

        if ($categories !== null) {
            return [
                'status' => 'Success',
                'message' => 'Categories retrieved successfully.',
                'categories' => $categories
            ];
        }

        return [
            'status' => 'Error',
            'message' => 'No categories found.'
        ];
    }

    public function getProducts($data = [])
    {
        $products = $this->productModel->getProducts(
            $data['role'] ?? '',
            $data['supplier_id'] ?? null,
            $data['search'] ?? '',
            $data['category_id'] ?? '',
            filter_var($data['isAll'] ?? false, FILTER_VALIDATE_BOOLEAN)
        );

        if ($products !== null) {
            return [
                'status' => 'Success',
                'message' => 'Products retrieved successfully.',
                'products' => $products
            ];
        }

        return [
            'status' => 'Error',
            'message' => 'No categories found.'
        ];
    }

    public function updateSellingPrice($data = [])
    {
        $productId = (int) ($data['product_id'] ?? 0);
        $sellingPrice = (float) ($data['selling_price'] ?? -1);

        if ($productId <= 0 || $sellingPrice < 0) {
            return [
                'status' => 'Error',
                'message' => 'A valid product and selling price are required.'
            ];
        }

        $updated = $this->productModel->updateSellingPrice(
            $productId,
            $sellingPrice,
            $data['role'] ?? ''
        );

        return [
            'status' => $updated ? 'Success' : 'Error',
            'message' => $updated ? 'Selling price updated successfully.' : 'Selling price was not updated.'
        ];
    }

    public function addProduct($data = [], $files = [])
    {
        $supplierId = (int) ($data['supplier_id'] ?? 0);
        $categoryId = (int) ($data['category_id'] ?? 0);
        $productName = trim((string) ($data['product_name'] ?? ''));
        $description = trim((string) ($data['description'] ?? ''));
        $wholesalePrice = (float) ($data['wholesale_price'] ?? -1);

        if ($supplierId <= 0 || $categoryId <= 0 || $productName === '' || $wholesalePrice < 0) {
            return ['status' => 'Error', 'message' => 'Product name, category, supplier, and price are required.'];
        }

        try {
            $created = $this->productModel->addProduct($supplierId, $categoryId, $productName, $description, $wholesalePrice, $files);
            return [
                'status' => $created ? 'Success' : 'Error',
                'message' => $created ? 'Product added successfully.' : 'Product could not be created.'
            ];
        } catch (\Throwable $error) {
            return ['status' => 'Error', 'message' => $error->getMessage()];
        }
    }

    public function updateProduct($data = [], $files = [])
    {
        $productId = (int) ($data['product_id'] ?? 0);
        $categoryId = isset($data['category_id']) ? (int) $data['category_id'] : null;
        $productName = trim((string) ($data['product_name'] ?? ''));
        $description = trim((string) ($data['description'] ?? ''));
        $wholesalePrice = isset($data['wholesale_price']) ? (float) $data['wholesale_price'] : null;

        if ($productId <= 0 || $productName === '' || $categoryId === null || $categoryId <= 0 || $wholesalePrice === null || $wholesalePrice < 0) {
            return ['status' => 'Error', 'message' => 'Product id, name, category, and price are required.'];
        }

        try {
            $updated = $this->productModel->updateProduct($productId, $categoryId, $productName, $description, $wholesalePrice, $files, $data['role'] ?? '');
            return [
                'status' => $updated ? 'Success' : 'Error',
                'message' => $updated ? 'Product updated successfully.' : 'Product could not be updated.'
            ];
        } catch (\Throwable $error) {
            return ['status' => 'Error', 'message' => $error->getMessage()];
        }
    }

    public function softDelete($data = [])
    {
        $productId = (int) ($data['product_id'] ?? 0);

        if ($productId <= 0) {
            return ['status' => 'Error', 'message' => 'A valid product is required.'];
        }

        $deleted = $this->productModel->softDelete($productId, $data['role'] ?? '');

        return [
            'status' => $deleted ? 'Success' : 'Error',
            'message' => $deleted ? 'Product deleted successfully.' : 'Product was not deleted.'
        ];
    }

    public function ensureStoreProduct($data = [])
    {
        $supplierProductId = (int) ($data['supplier_product_id'] ?? 0);
        $sellingPrice = isset($data['selling_price']) ? (float) $data['selling_price'] : null;

        if ($supplierProductId <= 0) {
            return ['status' => 'Error', 'message' => 'A valid supplier product is required.'];
        }

        try {
            $storeProductId = $this->productModel->ensureStoreProduct($supplierProductId, $sellingPrice);
            return [
                'status' => 'Success',
                'message' => 'Store product is ready for restocking.',
                'store_product_id' => $storeProductId
            ];
        } catch (\Throwable $error) {
            return ['status' => 'Error', 'message' => $error->getMessage()];
        }
    }

    public function restock($data = [])
    {
        $productId = (int) ($data['product_id'] ?? 0);
        $quantity = (int) ($data['quantity'] ?? 0);
        $expirationDate = $data['expiration_date'] ?? '';
        $paymentMethod = trim((string) ($data['payment_method'] ?? 'Cash'));

        if ($productId <= 0 || $quantity <= 0 || $expirationDate === '' || !in_array($paymentMethod, ['Cash', 'GCash'], true)) {
            return ['status' => 'Error', 'message' => 'Complete all restock fields with valid values.'];
        }

        try {
            $result = $this->productModel->restock(
                $productId,
                $quantity,
                $expirationDate,
                $paymentMethod
            );
            return [
                'status' => 'Success',
                'message' => 'Product restocked successfully.',
                'amount' => $result['amount'],
                'batchNumber' => $result['batchNumber'],
                'unitCost' => $result['unitCost']
            ];
        } catch (\Throwable $error) {
            return ['status' => 'Error', 'message' => $error->getMessage()];
        }
    }
}
