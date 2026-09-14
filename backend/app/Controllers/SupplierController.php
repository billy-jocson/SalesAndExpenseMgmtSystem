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
