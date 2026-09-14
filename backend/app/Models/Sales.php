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
}
