<?php

namespace App\Controllers;

use App\Models\Supplier;

class SupplierController
{
    private $supplierModel;

    public function __construct()
    {
        $this->supplierModel = new Supplier();
    }

    public function getSuppliers($data = [])
    {
        return $this->supplierModel->fetchSuppliers($data['search'] ?? '');
    }

    // Added the corresponding functions to handle incoming requests
    public function addSupplier($data)
    {
        $success = $this->supplierModel->addSupplier($data);
        return [
            'status' => $success ? 'Success' : 'Error',
            'message' => $success ? 'Supplier added successfully.' : 'Failed to add supplier.'
        ];
    }

    public function updateSupplier($data)
    {
        $success = $this->supplierModel->updateSupplier($data);
        return [
            'status' => $success ? 'Success' : 'Error',
            'message' => $success ? 'Supplier updated successfully.' : 'Failed to update supplier.'
        ];
    }

    public function softDelete($data = [])
    {
        $supplierId = (int) ($data['supplier_id'] ?? 0);

        if ($supplierId <= 0) {
            return ['status' => 'Error', 'message' => 'A valid supplier is required.'];
        }

        $deleted = $this->supplierModel->softDelete($supplierId);

        return [
            'status' => $deleted ? 'Success' : 'Error',
            'message' => $deleted ? 'Supplier deleted successfully.' : 'Supplier was not deleted.'
        ];
    }
}
