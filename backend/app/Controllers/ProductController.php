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
            $data['category_id'] ?? ''
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

    public function restock($data = [])
    {
        $productId = (int) ($data['product_id'] ?? 0);
        $quantity = (int) ($data['quantity'] ?? 0);
        $expirationDate = $data['expiration_date'] ?? '';

        if ($productId <= 0 || $quantity <= 0 || $expirationDate === '') {
            return ['status' => 'Error', 'message' => 'Complete all restock fields with valid values.'];
        }

        try {
            $result = $this->productModel->restock(
                $productId,
                $quantity,
                $expirationDate
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
