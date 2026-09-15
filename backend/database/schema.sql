-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 14, 2026 at 05:23 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

CREATE DATABASE IF NOT EXISTS `inventory_system` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `inventory_system`;

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `inventory_system`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_add_expense` (IN `p_amount` DECIMAL(10,2), IN `p_category_id` INT, IN `p_additional_description` VARCHAR(255), IN `p_payment_method_id` INT, IN `p_supplier_id` INT, IN `p_reference_code` VARCHAR(50))   BEGIN
    INSERT INTO expenses (
        category_id, 
        supplier_id, 
        payment_method_id, 
        reference_code, 
        amount, 
        additional_description
    )
    VALUES (
        p_category_id, 
        p_supplier_id, 
        p_payment_method_id, 
        p_reference_code, 
        p_amount, 
        p_additional_description
    );
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_generate_reports_summary` (IN `p_start` DATE, IN `p_end` DATE)   BEGIN
    SELECT
        sp.product_name AS product_name,
        COALESCE(SUM(si.quantity), 0) AS total_qty,
        COALESCE(SUM(si.quantity * si.unit_price), 0.00) AS total_sales,
        CASE 
            WHEN COALESCE(stock_data.total_stock, 0) = 0 THEN 'Out of Stock'
            WHEN COALESCE(stock_data.total_stock, 0) <= 10 THEN 'Low Stock'
            ELSE 'In Stock'
        END AS current_status
    FROM sales_items si
    JOIN sales s ON s.sale_id = si.sale_id
    JOIN store_products stp ON stp.store_product_id = si.store_product_id
    JOIN supplier_products sp ON sp.supplier_product_id = stp.supplier_product_id
    LEFT JOIN (
        SELECT store_product_id, SUM(quantity_in_stock) AS total_stock 
        FROM product_batches 
        GROUP BY store_product_id
    ) stock_data ON stock_data.store_product_id = stp.store_product_id
    WHERE DATE(s.sale_date) BETWEEN p_start AND p_end
    GROUP BY stp.store_product_id, sp.product_name, stock_data.total_stock
    ORDER BY total_sales DESC
    LIMIT 10;

    SELECT
        ec.category_name AS category_name,
        COALESCE(SUM(e.amount), 0.00) AS total_amount
    FROM expense_categories ec
    JOIN expenses e ON ec.category_id = e.category_id
    WHERE DATE(e.expense_date) BETWEEN p_start AND p_end
    GROUP BY ec.category_id, ec.category_name;

    SELECT
        COALESCE((SELECT SUM(v.total_amount) FROM vw_sales_summary v WHERE DATE(v.sale_date) BETWEEN p_start AND p_end), 0.00) AS total_sales,
        COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE DATE(e.expense_date) BETWEEN p_start AND p_end), 0.00) AS total_expenses,
        COALESCE((SELECT SUM(v.total_amount) FROM vw_sales_summary v WHERE DATE(v.sale_date) BETWEEN p_start AND p_end), 0.00) - 
        COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE DATE(e.expense_date) BETWEEN p_start AND p_end), 0.00) AS profit_loss;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_dashboard_analytics` (IN `p_period` VARCHAR(20))   BEGIN
    DECLARE v_start_date DATE;
    
    SET v_start_date = CASE
        WHEN p_period = 'Today' THEN CURDATE()
        WHEN p_period = 'This Week' THEN DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
        WHEN p_period = 'This Month' THEN DATE_FORMAT(CURDATE(), '%Y-%m-01')
        WHEN p_period = 'This Year' THEN DATE_FORMAT(CURDATE(), '%Y-01-01')
        ELSE '2000-01-01'
    END;

    SELECT
        COALESCE(sales_data.total_sales, 0.00) AS total_sales,
        COALESCE(expense_data.total_expenses, 0.00) AS total_expenses,
        COALESCE(sales_data.total_sales, 0.00) - COALESCE(expense_data.total_expenses, 0.00) AS net_income
    FROM (
        SELECT COALESCE(SUM(total_amount), 0.00) AS total_sales 
        FROM vw_sales_summary 
        WHERE DATE(sale_date) >= v_start_date
    ) sales_data
    CROSS JOIN (
        SELECT COALESCE(SUM(amount), 0.00) AS total_expenses 
        FROM expenses 
        WHERE DATE(expense_date) >= v_start_date
    ) expense_data;

    SELECT
        DATE(v.sale_date) AS chart_date,
        COALESCE(SUM(v.total_amount), 0.00) AS daily_sales
    FROM vw_sales_summary v
    WHERE DATE(v.sale_date) >= v_start_date
    GROUP BY DATE(v.sale_date)
    ORDER BY DATE(v.sale_date) ASC;

    SELECT
        ec.category_name AS category_name,
        COALESCE(SUM(e.amount), 0.00) AS category_total
    FROM expense_categories ec
    LEFT JOIN expenses e ON ec.category_id = e.category_id AND DATE(e.expense_date) >= v_start_date
    GROUP BY ec.category_id, ec.category_name
    HAVING category_total > 0;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `expenses`
--

CREATE TABLE `expenses` (
  `expense_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `supplier_id` int(11) DEFAULT NULL,
  `payment_method_id` int(11) NOT NULL,
  `reference_code` varchar(50) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `additional_description` varchar(255) DEFAULT NULL,
  `expense_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `expenses`
--

INSERT INTO `expenses` (`expense_id`, `category_id`, `supplier_id`, `payment_method_id`, `reference_code`, `amount`, `additional_description`, `expense_date`) VALUES
(1, 1, NULL, 1, '', 50000.00, 'Gave employees their salaries', '2026-09-14 04:16:24'),
(2, 3, NULL, 2, '1245617893124', 5000.00, 'Paid business insurance', '2026-09-14 07:07:05');

-- --------------------------------------------------------

--
-- Table structure for table `expense_categories`
--

CREATE TABLE `expense_categories` (
  `category_id` int(11) NOT NULL,
  `category_name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `expense_categories`
--

INSERT INTO `expense_categories` (`category_id`, `category_name`, `description`) VALUES
(1, 'Operating Expenses', 'Utilities (Electricity Bills, Ref), Transpo, Labor (Hired Helper), Store Supplies, Permits & Annual Licenses, Rent (Evaluate home)'),
(2, 'Capital Expenditures', 'One time or Long Term Expenses (Ex: Ref, renovation)'),
(3, 'Financing Cost & Interest', 'Bank Loans'),
(4, 'Inventory Shrinkage & Spoilage', 'Expired items & damaged items'),
(5, 'Penalties & Late Fees', 'Charges for late fee to Local Govt. Units like BIR, Brgy. permits, etc.'),
(6, 'Inventory', 'Products used to sell from the store.');

-- --------------------------------------------------------

--
-- Table structure for table `payment_methods`
--

CREATE TABLE `payment_methods` (
  `payment_method_id` int(11) NOT NULL,
  `method_name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payment_methods`
--

INSERT INTO `payment_methods` (`payment_method_id`, `method_name`) VALUES
(1, 'Cash'),
(2, 'GCash');

-- --------------------------------------------------------

--
-- Table structure for table `postal_codes`
--

CREATE TABLE `postal_codes` (
  `postal_code` varchar(20) NOT NULL,
  `city` varchar(100) NOT NULL,
  `state` varchar(100) NOT NULL,
  `country` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `postal_codes`
--

INSERT INTO `postal_codes` (`postal_code`, `city`, `state`, `country`) VALUES
('1000', 'Manila', 'NCR', 'Philippines'),
('4027', 'Calamba', 'Laguna', 'Philippines'),
('6000', 'Cebu', 'Cebu', 'Philippines');

-- --------------------------------------------------------

--
-- Table structure for table `product_batches`
--

CREATE TABLE `product_batches` (
  `batch_id` int(11) NOT NULL,
  `store_product_id` int(11) NOT NULL,
  `batch_number` varchar(50) NOT NULL,
  `quantity_in_stock` int(11) NOT NULL,
  `unit_cost` decimal(10,2) NOT NULL,
  `expiration_date` date NOT NULL,
  `received_date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `product_batches`
--

INSERT INTO `product_batches` (`batch_id`, `store_product_id`, `batch_number`, `quantity_in_stock`, `unit_cost`, `expiration_date`, `received_date`) VALUES
(1, 1, 'BATCH-1-001', 100, 12.00, '2027-06-01', '2026-07-15'),
(2, 2, 'BATCH-2-001', 100, 11.00, '2027-06-01', '2026-07-16'),
(3, 3, 'BATCH-3-001', 100, 15.00, '2027-06-10', '2026-07-18'),
(4, 4, 'BATCH-4-001', 100, 13.00, '2027-06-12', '2026-07-20'),
(5, 5, 'BATCH-5-001', 100, 9.00, '2027-06-15', '2026-07-22'),
(6, 6, 'BATCH-6-001', 50, 14.00, '2027-03-01', '2026-08-01'),
(7, 6, 'BATCH-6-002', 60, 14.50, '2027-04-01', '2026-08-15'),
(8, 7, 'BATCH-7-001', 50, 14.00, '2027-03-02', '2026-08-02'),
(9, 7, 'BATCH-7-002', 60, 14.50, '2027-04-02', '2026-08-16'),
(10, 8, 'BATCH-8-001', 100, 16.00, '2027-03-10', '2026-08-03'),
(11, 9, 'BATCH-9-001', 150, 7.00, '2027-03-15', '2026-08-05'),
(12, 10, 'BATCH-10-001', 80, 18.00, '2027-04-10', '2026-08-06'),
(13, 10, 'BATCH-10-002', 70, 18.50, '2027-05-10', '2026-08-20'),
(14, 11, 'BATCH-11-001', 50, 32.00, '2028-01-01', '2026-08-10'),
(15, 12, 'BATCH-12-001', 50, 16.00, '2028-01-05', '2026-08-11'),
(16, 13, 'BATCH-13-001', 50, 60.00, '2028-02-01', '2026-08-12'),
(17, 14, 'BATCH-14-001', 50, 35.00, '2028-02-10', '2026-08-13'),
(18, 15, 'BATCH-15-001', 50, 80.00, '2029-01-01', '2026-08-14'),
(19, 16, 'BATCH-16-001', 100, 12.00, '2027-01-10', '2026-08-15'),
(20, 17, 'BATCH-17-001', 100, 15.00, '2027-01-15', '2026-08-16'),
(21, 18, 'BATCH-18-001', 100, 18.00, '2027-06-01', '2026-08-18'),
(22, 19, 'BATCH-19-001', 100, 18.00, '2027-06-02', '2026-08-20'),
(23, 20, 'BATCH-20-001', 100, 25.00, '2027-07-01', '2026-08-22'),
(24, 21, 'BATCH-21-001', 100, 20.00, '2027-08-01', '2026-08-25'),
(25, 22, 'BATCH-22-001', 100, 25.00, '2027-08-05', '2026-08-26'),
(26, 23, 'BATCH-23-001', 200, 6.00, '2027-08-10', '2026-08-27'),
(27, 24, 'BATCH-24-001', 200, 5.00, '2027-08-12', '2026-08-28'),
(28, 25, 'BATCH-25-001', 200, 6.00, '2027-08-15', '2026-08-29'),
(29, 26, 'BATCH-26-001', 100, 7.00, '2027-09-01', '2026-09-01'),
(30, 27, 'BATCH-27-001', 100, 6.00, '2027-09-05', '2026-09-02'),
(31, 28, 'BATCH-28-001', 100, 13.00, '2028-02-01', '2026-09-03'),
(32, 29, 'BATCH-29-001', 100, 6.00, '2028-02-05', '2026-09-04'),
(33, 30, 'BATCH-30-001', 50, 45.00, '2028-02-10', '2026-09-05'),
(34, 31, 'BATCH-31-001', 100, 8.00, '2027-10-01', '2026-09-06'),
(35, 31, 'BATCH-31-002', 100, 8.20, '2027-11-01', '2026-09-15'),
(36, 32, 'BATCH-32-001', 100, 28.00, '2027-10-05', '2026-09-07'),
(37, 33, 'BATCH-33-001', 150, 3.00, '2027-10-10', '2026-09-08'),
(38, 33, 'BATCH-33-002', 150, 3.10, '2027-11-10', '2026-09-16'),
(39, 34, 'BATCH-34-001', 100, 5.00, '2027-10-12', '2026-09-09'),
(40, 35, 'BATCH-35-001', 100, 5.00, '2027-10-15', '2026-09-10');

-- --------------------------------------------------------

--
-- Table structure for table `product_categories`
--

CREATE TABLE `product_categories` (
  `category_id` int(11) NOT NULL,
  `category_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `product_categories`
--

INSERT INTO `product_categories` (`category_id`, `category_name`, `description`) VALUES
(1, 'Snacks', 'Chips, cornicks and biscuits'),
(2, 'Beverages', 'Softdrinks, juices and milk drinks'),
(3, 'Canned Goods', 'Tuna, sardines and corned beef'),
(4, 'Instant Noodles & Condiments', 'Pancit canton, toyo, suka, ketchup'),
(5, 'Personal Care', 'Soap, shampoo and toothpaste'),
(6, 'Household Cleaning', 'Detergent, bleach and dishwashing liquid'),
(7, 'Dairy and Coffee', 'Powdered milk and coffee sachets');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `role_id` int(11) NOT NULL,
  `role_name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`role_id`, `role_name`, `description`) VALUES
(1, 'Administrator', 'Full system access and management privileges'),
(2, 'Cashier Staff', 'Access to sales, POS transactions, and customer checkout'),
(3, 'Inventory Staff', 'Access to product batches, stock management, and purchase orders'),
(4, 'Supplier', 'External vendor access for submitting products');

-- --------------------------------------------------------

--
-- Table structure for table `sales`
--

CREATE TABLE `sales` (
  `sale_id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `payment_method_id` int(11) NOT NULL,
  `transaction_number` varchar(50) NOT NULL,
  `tax_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `sale_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sales_items`
--

CREATE TABLE `sales_items` (
  `sales_item_id` int(11) NOT NULL,
  `sale_id` int(11) NOT NULL,
  `store_product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `staffs`
--

CREATE TABLE `staffs` (
  `staff_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `middle_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `hire_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `staffs`
--

INSERT INTO `staffs` (`staff_id`, `user_id`, `first_name`, `middle_name`, `last_name`, `email`, `phone`, `hire_date`, `created_at`) VALUES
(1, 1, 'Alex', NULL, 'Systema', 'admin@example.com', '09170000001', '2026-09-11', '2026-09-11 13:45:31'),
(2, 2, 'Maria', NULL, 'Santos', 'cashier@example.com', '09170000002', '2026-09-11', '2026-09-11 13:45:31'),
(3, 3, 'Juan', NULL, 'Cruz', 'inventory@example.com', '09170000003', '2026-09-11', '2026-09-11 13:45:31');

-- --------------------------------------------------------

--
-- Table structure for table `store_products`
--

CREATE TABLE `store_products` (
  `store_product_id` int(11) NOT NULL,
  `supplier_product_id` int(11) NOT NULL,
  `selling_price` decimal(10,2) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `store_products`
--

INSERT INTO `store_products` (`store_product_id`, `supplier_product_id`, `selling_price`, `is_active`, `created_at`) VALUES
(1, 1, 18.00, 1, '2026-09-13 02:56:12'),
(2, 2, 17.00, 1, '2026-09-13 02:56:12'),
(3, 3, 22.00, 1, '2026-09-13 02:56:12'),
(4, 4, 20.00, 1, '2026-09-13 02:56:12'),
(5, 5, 15.00, 1, '2026-09-13 02:56:12'),
(6, 6, 20.00, 1, '2026-09-13 02:56:12'),
(7, 7, 20.00, 1, '2026-09-13 02:56:12'),
(8, 8, 22.00, 1, '2026-09-13 02:56:12'),
(9, 9, 12.00, 1, '2026-09-13 02:56:12'),
(10, 10, 25.00, 1, '2026-09-13 02:56:12'),
(11, 11, 45.00, 1, '2026-09-13 02:56:12'),
(12, 12, 30.00, 1, '2026-09-13 02:56:12'),
(13, 13, 85.00, 1, '2026-09-13 02:56:12'),
(14, 14, 48.00, 1, '2026-09-13 02:56:12'),
(15, 15, 110.00, 1, '2026-09-13 02:56:12'),
(16, 16, 18.00, 1, '2026-09-13 02:56:12'),
(17, 17, 22.00, 1, '2026-09-13 02:56:12'),
(18, 18, 25.00, 1, '2026-09-13 02:56:12'),
(19, 19, 25.00, 1, '2026-09-13 02:56:12'),
(20, 20, 35.00, 1, '2026-09-13 02:56:12'),
(21, 21, 28.00, 1, '2026-09-13 02:56:12'),
(22, 22, 35.00, 1, '2026-09-13 02:56:12'),
(23, 23, 10.00, 1, '2026-09-13 02:56:12'),
(24, 24, 8.00, 1, '2026-09-13 02:56:12'),
(25, 25, 10.00, 1, '2026-09-13 02:56:12'),
(26, 26, 12.00, 1, '2026-09-13 02:56:12'),
(27, 27, 11.00, 1, '2026-09-13 02:56:12'),
(28, 28, 20.00, 1, '2026-09-13 02:56:12'),
(29, 29, 10.00, 1, '2026-09-13 02:56:12'),
(30, 30, 65.00, 1, '2026-09-13 02:56:12'),
(31, 31, 12.00, 1, '2026-09-13 02:56:12'),
(32, 32, 38.00, 1, '2026-09-13 02:56:12'),
(33, 33, 5.00, 1, '2026-09-13 02:56:12'),
(34, 34, 8.00, 1, '2026-09-13 02:56:12'),
(35, 35, 8.00, 1, '2026-09-13 02:56:12');

-- --------------------------------------------------------

--
-- Table structure for table `suppliers`
--

CREATE TABLE `suppliers` (
  `supplier_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `supplier_name` varchar(100) NOT NULL,
  `contact_person` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `street_address` varchar(255) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `suppliers`
--

INSERT INTO `suppliers` (`supplier_id`, `user_id`, `supplier_name`, `contact_person`, `email`, `phone`, `street_address`, `postal_code`, `created_at`, `is_active`) VALUES
(1, 4, 'Universal Robina Corporation', 'URC Sales', 'sales@urc.com.ph', '09170000001', 'URC Compound Pasig', '1000', '2026-09-13 02:56:12', 1),
(2, 5, 'Liwayway Marketing Corp', 'Oishi Sales', 'sales@oishi.com.ph', '09170000002', 'Oishi Factory Laguna', '4027', '2026-09-13 02:56:12', 1),
(3, 6, 'Coca-Cola Beverages Philippines', 'Coke Sales', 'sales@coca-cola.com.ph', '09170000003', 'Coke Plant Laguna', '4027', '2026-09-13 02:56:12', 1),
(4, 7, 'Century Pacific Food Inc', 'Century Sales', 'sales@centurypacific.com.ph', '09170000004', 'Century Pasig', '1000', '2026-09-13 02:56:12', 1),
(5, 8, 'Nutri-Asia Inc', 'Nutri-Asia Sales', 'sales@nutriasia.com.ph', '09170000005', 'Nutri-Asia Cabuyao', '4027', '2026-09-13 02:56:12', 1),
(6, 9, 'Procter & Gamble Philippines', 'P&G Sales', 'sales@pg.com.ph', '09170000006', 'P&G BGC Taguig', '1000', '2026-09-13 02:56:12', 1),
(7, 10, 'Unilever Philippines', 'Unilever Sales', 'sales@unilever.com.ph', '09170000007', 'Unilever BGC', '1000', '2026-09-13 02:56:12', 0),
(8, 11, 'Nestle Philippines', 'Nestle Sales', 'sales@nestle.com.ph', '09170000008', 'Nestle Cabuyao', '4027', '2026-09-13 02:56:12', 1),
(9, 12, 'Zest-O Corporation', 'Zest-O Sales', 'sales@zesto.com.ph', '09170000009', 'Zest-O Caloocan', '1000', '2026-09-13 02:56:12', 1),
(10, 13, 'Colgate-Palmolive Philippines', 'Colgate Sales', 'sales@colgate.com.ph', '09170000010', 'Colgate Mkt', '1000', '2026-09-13 02:56:12', 1);

-- --------------------------------------------------------

--
-- Table structure for table `supplier_products`
--

CREATE TABLE `supplier_products` (
  `supplier_product_id` int(11) NOT NULL,
  `supplier_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `product_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `image_path` varchar(255) NOT NULL,
  `wholesale_price` decimal(10,2) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `supplier_products`
--

INSERT INTO `supplier_products` (`supplier_product_id`, `supplier_id`, `category_id`, `product_name`, `description`, `image_path`, `wholesale_price`, `is_active`, `created_at`) VALUES
(1, 1, 1, 'Piattos Cheese 40g', 'Potato crisps cheese', '/uploads/products/piattos_cheese.jpg', 12.00, 1, '2026-09-13 02:56:12'),
(2, 2, 1, 'Nova Country Cheddar 38g', 'Multigrain cheddar', '/uploads/products/nova_cheddar.jpg', 11.00, 1, '2026-09-13 02:56:12'),
(3, 1, 1, 'Chippy Barbecue 110g', 'Barbecue corn chips', '/uploads/products/chippy_bbq.jpg', 15.00, 1, '2026-09-13 02:56:12'),
(4, 2, 1, 'Boy Bawang Garlic 100g', 'Cornick garlic flavor', '/uploads/products/boy_bawang.jpg', 13.00, 1, '2026-09-13 02:56:12'),
(5, 1, 1, 'Cheese Ring 50g', 'Cheese flavored snacks', '/uploads/products/cheese_ring.jpg', 9.00, 1, '2026-09-13 02:56:12'),
(6, 3, 2, 'Coca-Cola Mismo 300ml', 'Coke 300ml', '/uploads/products/coke_mismo.jpg', 14.00, 1, '2026-09-13 02:56:12'),
(7, 3, 2, 'Royal True Orange Mismo 300ml', 'Orange softdrink', '/uploads/products/royal_mismo.jpg', 14.00, 1, '2026-09-13 02:56:12'),
(8, 1, 2, 'C2 Green Tea Apple 355ml', 'Green tea apple', '/uploads/products/c2_apple.jpg', 16.00, 1, '2026-09-13 02:56:12'),
(9, 9, 2, 'Zest-O Juice Orange 200ml', 'Orange juice drink', '/uploads/products/zesto_orange.jpg', 7.00, 1, '2026-09-13 02:56:12'),
(10, 8, 2, 'Bear Brand Sterilized Milk 200ml', 'Sterilized milk', '/uploads/products/bear_ste.jpg', 18.00, 1, '2026-09-13 02:56:12'),
(11, 4, 3, 'Century Tuna Flakes in Oil 180g', 'Tuna flakes', '/uploads/products/century_tuna.jpg', 32.00, 1, '2026-09-13 02:56:12'),
(12, 4, 3, '555 Sardines Tomato 155g', 'Sardines tomato', '/uploads/products/555_sardines.jpg', 16.00, 1, '2026-09-13 02:56:12'),
(13, 4, 3, 'Argentina Corned Beef 260g', 'Corned beef', '/uploads/products/argentina_corned.jpg', 60.00, 1, '2026-09-13 02:56:12'),
(14, 4, 3, 'San Marino Corned Tuna 180g', 'Corned tuna', '/uploads/products/san_marino.jpg', 35.00, 1, '2026-09-13 02:56:12'),
(15, 4, 3, 'Maling Luncheon Meat 397g', 'Luncheon meat', '/uploads/products/maling.jpg', 80.00, 1, '2026-09-13 02:56:12'),
(16, 2, 4, 'Lucky Me Pancit Canton Original 80g', 'Pancit canton', '/uploads/products/luckyme_canton.jpg', 12.00, 1, '2026-09-13 02:56:12'),
(17, 2, 4, 'Payless Pancit Canton Xtra Big 130g', 'Xtra big canton', '/uploads/products/payless_canton.jpg', 15.00, 1, '2026-09-13 02:56:12'),
(18, 5, 4, 'Datu Puti Soy Sauce 385ml', 'Soy sauce', '/uploads/products/datu_puti_soy.jpg', 18.00, 1, '2026-09-13 02:56:12'),
(19, 5, 4, 'Datu Puti Vinegar 385ml', 'Vinegar', '/uploads/products/datu_puti_vinegar.jpg', 18.00, 1, '2026-09-13 02:56:12'),
(20, 5, 4, 'UFC Tomato Ketchup 320g', 'Ketchup', '/uploads/products/ufc_ketchup.jpg', 25.00, 1, '2026-09-13 02:56:12'),
(21, 6, 5, 'Safeguard Pure White Soap 90g', 'Bath soap', '/uploads/products/safeguard.jpg', 20.00, 1, '2026-09-13 02:56:12'),
(22, 10, 5, 'Colgate Toothpaste 50ml', 'Toothpaste', '/uploads/products/colgate.jpg', 25.00, 1, '2026-09-13 02:56:12'),
(23, 6, 5, 'Head & Shoulders Shampoo 12ml', 'Shampoo sachet', '/uploads/products/head_shoulders.jpg', 6.00, 1, '2026-09-13 02:56:12'),
(24, 7, 5, 'Palmolive Shampoo Pink Sachet', 'Shampoo pink', '/uploads/products/palmolive_sham.jpg', 5.00, 1, '2026-09-13 02:56:12'),
(25, 7, 5, 'Dove Shampoo Sachet 12ml', 'Dove shampoo', '/uploads/products/dove_sham.jpg', 6.00, 1, '2026-09-13 02:56:12'),
(26, 6, 6, 'Ariel Detergent Powder 65g', 'Detergent powder', '/uploads/products/ariel_65.jpg', 7.00, 1, '2026-09-13 02:56:12'),
(27, 7, 6, 'Surf Detergent Powder Rose 65g', 'Surf rose', '/uploads/products/surf_65.jpg', 6.00, 1, '2026-09-13 02:56:12'),
(28, 6, 6, 'Zonrox Bleach Original 250ml', 'Bleach', '/uploads/products/zonrox_250.jpg', 13.00, 1, '2026-09-13 02:56:12'),
(29, 6, 6, 'Joy Dishwashing Liquid Kalamansi 40ml', 'Dishwashing', '/uploads/products/joy_40.jpg', 6.00, 1, '2026-09-13 02:56:12'),
(30, 7, 6, 'Domex Toilet Cleaner 500ml', 'Toilet cleaner', '/uploads/products/domex_500.jpg', 45.00, 1, '2026-09-13 02:56:12'),
(31, 8, 7, 'Bear Brand Powdered Milk Sachet 33g', 'Powdered milk', '/uploads/products/bear_sachet.jpg', 8.00, 1, '2026-09-13 02:56:12'),
(32, 8, 7, 'Alaska Evaporated Milk 370ml', 'Evap milk', '/uploads/products/alaska_evap.jpg', 28.00, 1, '2026-09-13 02:56:12'),
(33, 8, 7, 'Nescafe Original Stick 2g', 'Coffee stick', '/uploads/products/nescafe_stick.jpg', 3.00, 1, '2026-09-13 02:56:12'),
(34, 8, 7, 'Kopiko Brown Coffee 27.5g', 'Brown coffee', '/uploads/products/kopiko_brown.jpg', 5.00, 1, '2026-09-13 02:56:12'),
(35, 8, 7, 'Great Taste White Coffee 26g', 'White coffee', '/uploads/products/great_taste_white.jpg', 5.00, 1, '2026-09-13 02:56:12');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `role_id`, `username`, `password_hash`, `is_active`, `last_login`, `created_at`) VALUES
(1, 1, 'admin_user', '$2y$10$R45/Q5DHFgNMfeazP1HQa.UZ8T0zjcsHt5piLphwtUmhapNujcU9y', 1, NULL, '2026-09-11 13:45:31'),
(2, 2, 'cashier_user', '$2y$10$rqgUmszPiT3xQWGntSnSHO4jj6UFw7QyMJC0L1fyi/OAqb4gv3QGS', 1, NULL, '2026-09-11 13:45:31'),
(3, 3, 'inventory_user', '$2y$10$OMPOrqQLRkYwhH0SqnSq.eiRP8rMVX/areg3XJE0YH.oW6K2OSak2', 1, NULL, '2026-09-11 13:45:31'),
(4, 4, 'urc_supplier', '$2y$10$po1WMuDgZU3KgkBXJ2190eRkEj6qJ.QCTUQok8v9kRPna9k75z/si', 1, NULL, '2026-09-13 06:42:24'),
(5, 4, 'oishi_supplier', '$2y$10$M/uHAdCkWeYdIKmWlnJFnuFZj1/j1UY6BFuAUpBkeDVAQdCqTjwGu', 1, NULL, '2026-09-13 06:42:24'),
(6, 4, 'coke_supplier', '$2y$10$ksUQPviznhUk3u9mPXRN4OmkySW2sIYxRLi2FTYYNX/07W2Jwul4O', 1, NULL, '2026-09-13 06:42:24'),
(7, 4, 'century_supplier', '$2y$10$CRN0fPyK65o2QPIg0j8BvOFlTKDMkiWaid0U4SdPLW2ewETDBIhbm', 1, NULL, '2026-09-13 06:42:25'),
(8, 4, 'nutriasia_supplier', '$2y$10$s2mSP31UXQ/2q78FPhh1WOWwzqFel7dT0W8ewyfvtFsk/gN7XiH.C', 1, NULL, '2026-09-13 06:42:25'),
(9, 4, 'pg_supplier', '$2y$10$gFvSz7RitCPS8SgSvrp32u21.iiBKXv5ZFQA/dnnBCM3HORrFu/c2', 1, NULL, '2026-09-13 06:42:25'),
(10, 4, 'unilever_supplier', '$2y$10$A/5.2.ayAbXV8e0pKIVEV.2iocwLFuzuCrq14JdUFGqsNbgj4r/Ye', 1, NULL, '2026-09-13 06:42:25'),
(11, 4, 'nestle_supplier', '$2y$10$3FpFQy82CNz8Ta6Ji16xk.CQqEXckkjNlIb9/XiMPSiNTs6x3yhFW', 1, NULL, '2026-09-13 06:42:25'),
(12, 4, 'zesto_supplier', '$2y$10$nbwIU05lzY73/5LgHBFTEOAZw5RgmLinmj5YgxFlr94vnEibPQGI6', 1, NULL, '2026-09-13 06:42:25'),
(13, 4, 'colgate_supplier', '$2y$10$uOHy/nWPdtIL/LfT3bjtt..err7wDsLR31/1nvOfWGnWWfEKMs4uW', 1, NULL, '2026-09-13 06:42:25');

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_sales_summary`
-- (See below for the actual view)
--
CREATE TABLE `vw_sales_summary` (
`sale_id` int(11)
,`staff_id` int(11)
,`payment_method_id` int(11)
,`transaction_number` varchar(50)
,`subtotal` decimal(42,2)
,`tax_amount` decimal(10,2)
,`total_amount` decimal(43,2)
,`sale_date` timestamp
);

-- --------------------------------------------------------

--
-- Structure for view `vw_sales_summary`
--
DROP TABLE IF EXISTS `vw_sales_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_sales_summary`  AS SELECT `s`.`sale_id` AS `sale_id`, `s`.`staff_id` AS `staff_id`, `s`.`payment_method_id` AS `payment_method_id`, `s`.`transaction_number` AS `transaction_number`, coalesce(sum(`si`.`quantity` * `si`.`unit_price`),0.00) AS `subtotal`, `s`.`tax_amount` AS `tax_amount`, coalesce(sum(`si`.`quantity` * `si`.`unit_price`),0.00) + `s`.`tax_amount` AS `total_amount`, `s`.`sale_date` AS `sale_date` FROM (`sales` `s` left join `sales_items` `si` on(`s`.`sale_id` = `si`.`sale_id`)) GROUP BY `s`.`sale_id`, `s`.`staff_id`, `s`.`payment_method_id`, `s`.`transaction_number`, `s`.`tax_amount`, `s`.`sale_date` ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `expenses`
--
ALTER TABLE `expenses`
  ADD PRIMARY KEY (`expense_id`),
  ADD KEY `fk_expenses_category` (`category_id`),
  ADD KEY `fk_expenses_payment` (`payment_method_id`),
  ADD KEY `fk_expenses_supplier` (`supplier_id`);

--
-- Indexes for table `expense_categories`
--
ALTER TABLE `expense_categories`
  ADD PRIMARY KEY (`category_id`),
  ADD UNIQUE KEY `category_name` (`category_name`);

--
-- Indexes for table `payment_methods`
--
ALTER TABLE `payment_methods`
  ADD PRIMARY KEY (`payment_method_id`);

--
-- Indexes for table `postal_codes`
--
ALTER TABLE `postal_codes`
  ADD PRIMARY KEY (`postal_code`);

--
-- Indexes for table `product_batches`
--
ALTER TABLE `product_batches`
  ADD PRIMARY KEY (`batch_id`),
  ADD KEY `fk_batches_store_product` (`store_product_id`);

--
-- Indexes for table `product_categories`
--
ALTER TABLE `product_categories`
  ADD PRIMARY KEY (`category_id`),
  ADD UNIQUE KEY `category_name` (`category_name`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`role_id`),
  ADD UNIQUE KEY `role_name` (`role_name`);

--
-- Indexes for table `sales`
--
ALTER TABLE `sales`
  ADD PRIMARY KEY (`sale_id`),
  ADD UNIQUE KEY `transaction_number` (`transaction_number`),
  ADD KEY `fk_sales_staff` (`staff_id`),
  ADD KEY `fk_sales_payment` (`payment_method_id`);

--
-- Indexes for table `sales_items`
--
ALTER TABLE `sales_items`
  ADD PRIMARY KEY (`sales_item_id`),
  ADD KEY `fk_si_sales` (`sale_id`),
  ADD KEY `fk_si_store_product` (`store_product_id`);

--
-- Indexes for table `staffs`
--
ALTER TABLE `staffs`
  ADD PRIMARY KEY (`staff_id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `store_products`
--
ALTER TABLE `store_products`
  ADD PRIMARY KEY (`store_product_id`),
  ADD KEY `fk_store_supplier_product` (`supplier_product_id`);

--
-- Indexes for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`supplier_id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD KEY `fk_suppliers_postal` (`postal_code`);

--
-- Indexes for table `supplier_products`
--
ALTER TABLE `supplier_products`
  ADD PRIMARY KEY (`supplier_product_id`),
  ADD KEY `fk_sp_supplier` (`supplier_id`),
  ADD KEY `fk_sp_category` (`category_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `fk_users_roles` (`role_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `expenses`
--
ALTER TABLE `expenses`
  MODIFY `expense_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `expense_categories`
--
ALTER TABLE `expense_categories`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `payment_methods`
--
ALTER TABLE `payment_methods`
  MODIFY `payment_method_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `product_batches`
--
ALTER TABLE `product_batches`
  MODIFY `batch_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT for table `product_categories`
--
ALTER TABLE `product_categories`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `role_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `sales`
--
ALTER TABLE `sales`
  MODIFY `sale_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sales_items`
--
ALTER TABLE `sales_items`
  MODIFY `sales_item_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `staffs`
--
ALTER TABLE `staffs`
  MODIFY `staff_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `store_products`
--
ALTER TABLE `store_products`
  MODIFY `store_product_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `supplier_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `supplier_products`
--
ALTER TABLE `supplier_products`
  MODIFY `supplier_product_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `expenses`
--
ALTER TABLE `expenses`
  ADD CONSTRAINT `fk_expenses_category` FOREIGN KEY (`category_id`) REFERENCES `expense_categories` (`category_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expenses_payment` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods` (`payment_method_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expenses_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`supplier_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `product_batches`
--
ALTER TABLE `product_batches`
  ADD CONSTRAINT `fk_batches_store_product` FOREIGN KEY (`store_product_id`) REFERENCES `store_products` (`store_product_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `sales`
--
ALTER TABLE `sales`
  ADD CONSTRAINT `fk_sales_payment` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods` (`payment_method_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_sales_staff` FOREIGN KEY (`staff_id`) REFERENCES `staffs` (`staff_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `sales_items`
--
ALTER TABLE `sales_items`
  ADD CONSTRAINT `fk_si_sales` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`sale_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_si_store_product` FOREIGN KEY (`store_product_id`) REFERENCES `store_products` (`store_product_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `staffs`
--
ALTER TABLE `staffs`
  ADD CONSTRAINT `fk_staffs_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `store_products`
--
ALTER TABLE `store_products`
  ADD CONSTRAINT `fk_store_supplier_product` FOREIGN KEY (`supplier_product_id`) REFERENCES `supplier_products` (`supplier_product_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD CONSTRAINT `fk_suppliers_postal` FOREIGN KEY (`postal_code`) REFERENCES `postal_codes` (`postal_code`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_suppliers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `supplier_products`
--
ALTER TABLE `supplier_products`
  ADD CONSTRAINT `fk_sp_category` FOREIGN KEY (`category_id`) REFERENCES `product_categories` (`category_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_sp_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`supplier_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_roles` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
