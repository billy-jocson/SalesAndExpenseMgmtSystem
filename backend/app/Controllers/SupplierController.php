<?php

namespace App\Controllers;

use App\Models\Supplier;
use Exception;

class SupplierController
{
    private $supplierModel;

    public function __construct()
    {
        $this->supplierModel = new Supplier();
    }

    public function getSuppliers($data = [])
    {
        try {
            $search = trim($data['search'] ?? '');
            $suppliers = $this->supplierModel->fetchSuppliers($search);
            
            return [
                'status' => 'Success',
                'message' => 'Suppliers fetched successfully.',
                'data' => $suppliers,
                'http_code' => 200
            ];
        } catch (Exception $e) {
            return [
                'status' => 'Error',
                'message' => $e->getMessage(),
                'http_code' => 500
            ];
        }
    }

    public function addSupplier($data)
    {
        try {
            $result = $this->supplierModel->addSupplier($data);
            
            return [
                'status' => 'Success',
                'message' => 'Supplier added successfully.',
                'data' => $result,
                'http_code' => 201
            ];
        } catch (Exception $e) {
            $message = $e->getMessage();
            $code = 400;

            
            if (strpos($message, 'already exists') !== false || strpos($message, 'already taken') !== false) {
                $code = 409;
            } elseif (strpos($message, 'Failed to create') !== false) {
                $code = 500;
            }

            return [
                'status' => 'Error',
                'message' => $message,
                'http_code' => $code
            ];
        }
    }

    public function updateSupplier($data)
    {
        try {
            if (empty($data['supplier_id'])) {
                return [
                    'status' => 'Error',
                    'message' => 'Supplier ID is required.',
                    'http_code' => 400
                ];
            }

            $success = $this->supplierModel->updateSupplier($data);
            
            return [
                'status' => $success ? 'Success' : 'Error',
                'message' => $success ? 'Supplier updated successfully.' : 'Failed to update supplier.',
                'http_code' => $success ? 200 : 400
            ];
        } catch (Exception $e) {
            return [
                'status' => 'Error',
                'message' => $e->getMessage(),
                'http_code' => 400
            ];
        }
    }

    public function softDelete($data = [])
    {
        try {
            $supplierId = (int)($data['supplier_id'] ?? 0);

            if ($supplierId <= 0) {
                return [
                    'status' => 'Error',
                    'message' => 'A valid supplier ID is required.',
                    'http_code' => 400
                ];
            }

            $deleted = $this->supplierModel->softDelete($supplierId);

            if (!$deleted) {
                return [
                    'status' => 'Error',
                    'message' => 'Supplier not found or already deleted.',
                    'http_code' => 404
                ];
            }

            return [
                'status' => 'Success',
                'message' => 'Supplier deleted successfully.',
                'http_code' => 200
            ];
        } catch (Exception $e) {
            return [
                'status' => 'Error',
                'message' => $e->getMessage(),
                'http_code' => 500
            ];
        }
    }
}
