-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3307
-- Generation Time: Oct 04, 2026 at 08:44 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

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
CREATE  PROCEDURE `sp_add_expense` (IN `p_amount` DECIMAL(10,2), IN `p_category_id` INT, IN `p_additional_description` VARCHAR(255), IN `p_payment_method_id` INT, IN `p_supplier_id` INT, IN `p_reference_code` VARCHAR(50))   BEGIN
    INSERT INTO expenses (
        amount,
        category_id,
        additional_description,
        payment_method_id,
        supplier_id,
        reference_code,
        expense_date
    )
    VALUES (
        p_amount,
        p_category_id,
        p_additional_description,
        p_payment_method_id,
        p_supplier_id,
        p_reference_code,
        NOW()
    );
END$$

CREATE  PROCEDURE `sp_dashboard_card_analytics` (IN `p_start_date` DATE, IN `p_end_date` DATE)   BEGIN
    DECLARE v_days INT;
    DECLARE v_prev_start DATE;
    DECLARE v_prev_end DATE;
    
    SET v_days = DATEDIFF(p_end_date, p_start_date) + 1;
    SET v_prev_end = DATE_SUB(p_start_date, INTERVAL 1 DAY);
    SET v_prev_start = DATE_SUB(p_start_date, INTERVAL v_days DAY);
    
    SELECT
        COALESCE(SUM(CASE WHEN DATE(sale_date) BETWEEN p_start_date AND p_end_date THEN total_amount ELSE 0 END), 0.00) AS current_sales,
        COALESCE(SUM(CASE WHEN DATE(sale_date) BETWEEN v_prev_start AND v_prev_end THEN total_amount ELSE 0 END), 0.00) AS previous_sales,
        (SELECT COALESCE(SUM(CASE WHEN DATE(expense_date) BETWEEN p_start_date AND p_end_date THEN amount ELSE 0 END), 0.00) FROM expenses) AS current_expenses,
        (SELECT COALESCE(SUM(CASE WHEN DATE(expense_date) BETWEEN v_prev_start AND v_prev_end THEN amount ELSE 0 END), 0.00) FROM expenses) AS previous_expenses
    FROM vw_sales_summary;
END$$

CREATE  PROCEDURE `sp_dashboard_chart_data` (IN `p_start_date` DATE, IN `p_end_date` DATE)   BEGIN
    SELECT 
        ec.category_name as category_name, 
        CAST(COALESCE(SUM(e.amount), 0.00) AS DECIMAL(10,2)) AS total_amount
    FROM expense_categories ec
    LEFT JOIN expenses e ON ec.category_id = e.category_id 
        AND DATE(e.expense_date) BETWEEN p_start_date AND p_end_date
    GROUP BY ec.category_id, ec.category_name
    ORDER BY ec.category_name ASC;
END$$

CREATE  PROCEDURE `sp_dashboard_line_chart_data` (IN `p_start_date` DATE, IN `p_end_date` DATE)   BEGIN
    SELECT 
        date_list.entry_date AS _date,
        CAST(COALESCE(SUM(date_list.sales), 0.00) AS DECIMAL(10,2)) AS sales,
        CAST(COALESCE(SUM(date_list.expense), 0.00) AS DECIMAL(10,2)) AS expense
    FROM (
        SELECT 
            DATE(s.sale_date) AS entry_date, 
            (SUM(si.quantity * si.unit_price) + s.tax_amount) AS sales, 
            0.00 AS expense 
        FROM sales s
        LEFT JOIN sales_items si ON s.sale_id = si.sale_id
        WHERE DATE(s.sale_date) BETWEEN p_start_date AND p_end_date
        GROUP BY s.sale_id, DATE(s.sale_date), s.tax_amount
        
        UNION ALL
        
        SELECT 
            DATE(e.expense_date) AS entry_date, 
            0.00 AS sales, 
            e.amount AS expense 
        FROM expenses e
        WHERE DATE(e.expense_date) BETWEEN p_start_date AND p_end_date
    ) AS date_list
    GROUP BY date_list.entry_date
    ORDER BY date_list.entry_date ASC;
END$$

CREATE  PROCEDURE `sp_dashboard_supplier_card_analytics` (IN `p_supplier_id` INT)   BEGIN
    SELECT 
        (
            SELECT COUNT(*) 
            FROM supplier_products 
            WHERE supplier_id = p_supplier_id
        ) AS totalProducts,
        (
            SELECT COALESCE(SUM(e.amount), 0.00)
            FROM expenses e
            JOIN expense_categories ec ON e.category_id = ec.category_id
            WHERE e.supplier_id = p_supplier_id AND ec.category_name = 'Inventory'
        ) AS totalRevenue;
END$$

CREATE  PROCEDURE `sp_dashboard_supplier_chart_data` (IN `p_start_date` DATE, IN `p_end_date` DATE, IN `p_supplier_id` INT)   BEGIN
    SELECT 
        pc.category_name,
        COUNT(sp.supplier_product_id) AS product_count
    FROM supplier_products sp
    INNER JOIN product_categories pc ON sp.category_id = pc.category_id
    WHERE sp.supplier_id = p_supplier_id
    AND DATE(sp.created_at) BETWEEN p_start_date AND p_end_date
    GROUP BY pc.category_id, pc.category_name
    ORDER BY pc.category_name ASC;
END$$

CREATE  PROCEDURE `sp_dashboard_supplier_line_chart_data` (IN `p_start_date` DATE, IN `p_end_date` DATE, IN `p_supplier_id` INT)   BEGIN
    SELECT 
        DATE(expense_date) AS _date, 
        CAST(COALESCE(SUM(amount), 0.00) AS DECIMAL(10,2)) AS total_amount
    FROM expenses
    WHERE supplier_id = p_supplier_id
        AND DATE(expense_date) BETWEEN p_start_date AND p_end_date
    GROUP BY DATE(expense_date)
    ORDER BY _date ASC;
END$$

CREATE  PROCEDURE `sp_expenses_fetch_all` (IN `p_search` VARCHAR(255), IN `p_category_id` INT, IN `p_start_date` VARCHAR(20), IN `p_end_date` VARCHAR(20))   BEGIN
    SELECT 
        e.expense_id,
        ec.category_name, 
        e.additional_description, 
        COALESCE(e.amount, 0.00) AS amount, 
        pm.method_name, 
        COALESCE(e.reference_code, 'N/A') AS refcode,
        e.expense_date
    FROM expenses e 
    LEFT JOIN expense_categories ec ON e.category_id = ec.category_id
    LEFT JOIN payment_methods pm ON e.payment_method_id = pm.payment_method_id
    WHERE 
        (p_search IS NULL OR p_search = '' OR (e.additional_description LIKE CONCAT('%', p_search, '%') OR ec.category_name LIKE CONCAT('%', p_search, '%')))
        AND (p_category_id IS NULL OR p_category_id = 0 OR e.category_id = p_category_id)
        AND (
            (p_start_date IS NULL OR p_start_date = '' OR p_end_date IS NULL OR p_end_date = '')
            OR (DATE(e.expense_date) BETWEEN p_start_date AND p_end_date)
        )
    ORDER BY e.expense_date DESC;
END$$

CREATE  PROCEDURE `sp_expense_categories_get` ()   BEGIN
    SELECT 
        category_id,
        category_name,
        description
    FROM expense_categories
    ORDER BY category_name ASC;
END$$

CREATE  PROCEDURE `sp_generate_reports_summary` (IN `p_start` DATE, IN `p_end` DATE)   BEGIN
    -- 1. Top 10 Selling Products
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

    -- 2. Breakdown ng Expenses
    SELECT
        ec.category_name AS category_name,
        COALESCE(SUM(e.amount), 0.00) AS total_amount
    FROM expense_categories ec
    JOIN expenses e ON ec.category_id = e.category_id
    WHERE DATE(e.expense_date) BETWEEN p_start AND p_end
    GROUP BY ec.category_id, ec.category_name;

    -- 3. Overall Totals
    SELECT
        COALESCE((SELECT SUM(v.total_amount) FROM vw_sales_summary v WHERE DATE(v.sale_date) BETWEEN p_start AND p_end), 0.00) AS total_sales,
        COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE DATE(e.expense_date) BETWEEN p_start AND p_end), 0.00) AS total_expenses,
        COALESCE((SELECT SUM(v.total_amount) FROM vw_sales_summary v WHERE DATE(v.sale_date) BETWEEN p_start AND p_end), 0.00) - 
        COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE DATE(e.expense_date) BETWEEN p_start AND p_end), 0.00) AS profit_loss;

    -- 4. Category Sales Volume
    SELECT
        pc.category_name AS category_name,
        COALESCE(SUM(si.quantity), 0) AS total_qty
    FROM sales_items si
    JOIN sales s ON s.sale_id = si.sale_id
    JOIN store_products stp ON stp.store_product_id = si.store_product_id
    JOIN supplier_products sp ON sp.supplier_product_id = stp.supplier_product_id
    JOIN product_categories pc ON pc.category_id = sp.category_id
    WHERE DATE(s.sale_date) BETWEEN p_start AND p_end
    GROUP BY pc.category_id, pc.category_name
    ORDER BY total_qty DESC;

    -- 5. Monthly Trend
    SELECT
        report_month,
        CAST(SUM(total_sales) AS DECIMAL(10,2)) AS total_sales,
        CAST(SUM(total_expenses) AS DECIMAL(10,2)) AS total_expenses
    FROM (
        SELECT
            DATE_FORMAT(sale_date, '%Y-%m') AS report_month,
            SUM(total_amount) AS total_sales,
            0.00 AS total_expenses
        FROM vw_sales_summary
        WHERE DATE(sale_date) BETWEEN p_start AND p_end
        GROUP BY DATE_FORMAT(sale_date, '%Y-%m')

        UNION ALL

        SELECT
            DATE_FORMAT(expense_date, '%Y-%m') AS report_month,
            0.00 AS total_sales,
            SUM(amount) AS total_expenses
        FROM expenses
        WHERE DATE(expense_date) BETWEEN p_start AND p_end
        GROUP BY DATE_FORMAT(expense_date, '%Y-%m')
    ) monthly_data
    GROUP BY report_month
    ORDER BY report_month ASC;
END$$

CREATE  PROCEDURE `sp_get_dashboard_analytics` (IN `p_period` VARCHAR(20))   BEGIN
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

CREATE  PROCEDURE `sp_payment_methods_get` ()   BEGIN
    SELECT 
        payment_method_id,
        method_name
    FROM payment_methods
    ORDER BY payment_method_id ASC;
END$$

CREATE  PROCEDURE `sp_postal_codes_add` (IN `p_postal_code` VARCHAR(20), IN `p_city` VARCHAR(100), IN `p_state` VARCHAR(100), IN `p_country` VARCHAR(100))   BEGIN
    DECLARE v_exists INT DEFAULT 0;
    
    SELECT COUNT(*) INTO v_exists FROM postal_codes WHERE postal_code = p_postal_code;
    
    IF v_exists > 0 THEN
        SELECT 'exists' AS status, 'Postal code already exists.' AS message;
    ELSE
        INSERT INTO postal_codes (postal_code, city, state, country) 
        VALUES (p_postal_code, p_city, p_state, p_country);
        SELECT 'success' AS status, 'Postal code added successfully.' AS message;
    END IF;
END$$

CREATE  PROCEDURE `sp_postal_codes_fetch` (IN `p_search` VARCHAR(255))   BEGIN
    IF p_search IS NULL OR p_search = '' THEN
        SELECT postal_code, city, state, country 
        FROM postal_codes 
        ORDER BY postal_code ASC 
        LIMIT 100;
    ELSE
        SET @search_term = CONCAT('%', p_search, '%');
        SELECT postal_code, city, state, country 
        FROM postal_codes
        WHERE postal_code LIKE @search_term 
           OR city LIKE @search_term 
           OR state LIKE @search_term 
           OR country LIKE @search_term
        ORDER BY postal_code ASC 
        LIMIT 100;
    END IF;
END$$

CREATE  PROCEDURE `sp_products_ensure_store_product` (IN `p_supplier_product_id` INT, IN `p_selling_price` DECIMAL(10,2))   BEGIN
    DECLARE v_store_id INT;
    SELECT store_product_id INTO v_store_id FROM store_products WHERE supplier_product_id = p_supplier_product_id LIMIT 1;
    IF v_store_id IS NULL THEN
        INSERT INTO store_products (supplier_product_id, selling_price) VALUES (p_supplier_product_id, IFNULL(p_selling_price, 0));
        SET v_store_id = LAST_INSERT_ID();
    ELSE
        IF p_selling_price IS NOT NULL THEN
            UPDATE store_products SET selling_price = p_selling_price WHERE store_product_id = v_store_id;
        END IF;
    END IF;
    SELECT v_store_id AS store_product_id;
END$$

CREATE  PROCEDURE `sp_products_get` (IN `p_role` VARCHAR(20), IN `p_supplier_id` INT, IN `p_search` VARCHAR(255), IN `p_category_id` INT, IN `p_is_all` INT)   BEGIN
    -- KUNG SUPPLIER ANG NAKA-LOGIN O KAYA ORDER PRODUCTS MODAL ANG BUKAS (p_is_all = 1)
    IF LOWER(TRIM(p_role)) = 'supplier' OR p_is_all = 1 THEN
        SELECT 
            sp.supplier_product_id AS id,
            sp.supplier_product_id,
            sp.supplier_id,
            COALESCE(s.supplier_name, 'Unknown Supplier') AS supplier_name,
            sp.category_id,
            COALESCE(pc.category_name, 'General') AS category,
            COALESCE(pc.category_name, 'General') AS category_name,
            sp.product_name AS name,
            sp.product_name AS prodname,
            sp.product_name,
            sp.description,
            sp.image_path,
            COALESCE(sp.wholesale_price, 0.00) AS price,
            COALESCE(sp.wholesale_price, 0.00) AS wholesale_price,
            COALESCE(sp.wholesale_price, 0.00) AS selling_price,
            COALESCE(sp.wholesale_price, 0.00) AS sellprice
        FROM supplier_products sp 
        LEFT JOIN suppliers s ON sp.supplier_id = s.supplier_id
        LEFT JOIN product_categories pc ON sp.category_id = pc.category_id
        WHERE sp.is_active = 1
        AND (p_is_all = 1 OR p_supplier_id = 0 OR sp.supplier_id = p_supplier_id)
        AND (p_search = '' OR sp.product_name LIKE CONCAT('%', p_search, '%'))
        AND (p_category_id = 0 OR sp.category_id = p_category_id)
        ORDER BY sp.supplier_product_id DESC;
    ELSE
        -- REGULAR STORE VIEW PARA SA ADMIN / CASHIER / INVENTORY STAFF (store_products)
        SELECT 
            stp.store_product_id AS id,
            stp.store_product_id,
            sp.supplier_product_id,
            sp.supplier_id,
            COALESCE(s.supplier_name, 'Unknown Supplier') AS supplier_name,
            sp.category_id,
            COALESCE(pc.category_name, 'General') AS category,
            COALESCE(pc.category_name, 'General') AS category_name,
            sp.product_name AS name,
            sp.product_name AS prodname,
            sp.product_name,
            sp.description,
            sp.image_path,
            COALESCE(stp.selling_price, sp.wholesale_price, 0.00) AS price,
            COALESCE(sp.wholesale_price, 0.00) AS wholesale_price,
            COALESCE(stp.selling_price, sp.wholesale_price, 0.00) AS selling_price,
            COALESCE(stp.selling_price, sp.wholesale_price, 0.00) AS sellprice
        FROM store_products stp 
        JOIN supplier_products sp ON stp.supplier_product_id = sp.supplier_product_id 
        LEFT JOIN suppliers s ON sp.supplier_id = s.supplier_id
        LEFT JOIN product_categories pc ON sp.category_id = pc.category_id
        WHERE stp.is_active = 1 AND sp.is_active = 1
        AND (p_search = '' OR sp.product_name LIKE CONCAT('%', p_search, '%'))
        AND (p_category_id = 0 OR sp.category_id = p_category_id)
        ORDER BY stp.store_product_id DESC;
    END IF;
END$$

CREATE  PROCEDURE `sp_products_get_image_path` (IN `p_product_id` INT, IN `p_role` VARCHAR(20))   BEGIN
    IF LOWER(TRIM(p_role)) = 'supplier' THEN
        SELECT image_path FROM supplier_products WHERE supplier_product_id = p_product_id;
    ELSE
        SELECT sp.image_path 
        FROM supplier_products sp
        JOIN store_products stp ON sp.supplier_product_id = stp.supplier_product_id
        WHERE stp.store_product_id = p_product_id;
    END IF;
END$$

CREATE  PROCEDURE `sp_products_restock` (IN `p_store_product_id` INT, IN `p_quantity` INT, IN `p_expiration_date` DATE, IN `p_payment_method` VARCHAR(20))   BEGIN
    DECLARE v_unit_cost DECIMAL(10,2);
    DECLARE v_amount DECIMAL(10,2);
    DECLARE v_batch VARCHAR(50);
    SELECT wholesale_price INTO v_unit_cost FROM supplier_products sp JOIN store_products stp ON sp.supplier_product_id = stp.supplier_product_id WHERE stp.store_product_id = p_store_product_id;
    SET v_amount = v_unit_cost * p_quantity;
    SET v_batch = CONCAT('BATCH-', UNIX_TIMESTAMP());
    INSERT INTO inventory_batches (store_product_id, quantity, expiration_date, payment_method, unit_cost, amount, batch_number) VALUES (p_store_product_id, p_quantity, p_expiration_date, p_payment_method, v_unit_cost, v_amount, v_batch);
    SELECT v_amount AS amount, v_batch AS batchNumber, v_unit_cost AS unitCost;
END$$

CREATE  PROCEDURE `sp_products_soft_delete` (IN `p_product_id` INT, IN `p_role` VARCHAR(20))   BEGIN
    IF LOWER(TRIM(p_role)) = 'supplier' THEN
        UPDATE supplier_products SET is_active = 0 WHERE supplier_product_id = p_product_id;
    ELSE
        UPDATE store_products SET is_active = 0 WHERE store_product_id = p_product_id;
    END IF;
    SELECT ROW_COUNT() AS affected_rows;
END$$

CREATE  PROCEDURE `sp_products_update` (IN `p_product_id` INT, IN `p_category_id` INT, IN `p_product_name` VARCHAR(255), IN `p_description` TEXT, IN `p_image_path` VARCHAR(255), IN `p_wholesale_price` DECIMAL(10,2), IN `p_role` VARCHAR(20))   BEGIN
    IF LOWER(TRIM(p_role)) = 'supplier' THEN
        UPDATE supplier_products 
        SET category_id = p_category_id, 
            product_name = p_product_name, 
            description = p_description, 
            image_path = p_image_path, 
            wholesale_price = p_wholesale_price 
        WHERE supplier_product_id = p_product_id;
    ELSE
        UPDATE supplier_products sp
        JOIN store_products stp ON stp.supplier_product_id = sp.supplier_product_id
        SET sp.category_id = p_category_id, 
            sp.product_name = p_product_name, 
            sp.description = p_description, 
            sp.image_path = p_image_path, 
            sp.wholesale_price = p_wholesale_price 
        WHERE stp.store_product_id = p_product_id;
    END IF;
    SELECT ROW_COUNT() AS affected_rows;
END$$

CREATE  PROCEDURE `sp_products_update_selling_price` (IN `p_product_id` INT, IN `p_selling_price` DECIMAL(10,2), IN `p_role` VARCHAR(20))   BEGIN
    IF LOWER(TRIM(p_role)) = 'supplier' THEN
        UPDATE supplier_products SET wholesale_price = p_selling_price WHERE supplier_product_id = p_product_id;
    ELSE
        UPDATE store_products SET selling_price = p_selling_price WHERE store_product_id = p_product_id;
    END IF;
    SELECT ROW_COUNT() AS affected_rows;
END$$

CREATE  PROCEDURE `sp_products_update_store_only` (IN `p_product_id` INT, IN `p_category_id` INT, IN `p_product_name` VARCHAR(255), IN `p_description` TEXT, IN `p_image_path` VARCHAR(255), IN `p_wholesale_price` DECIMAL(10,2))   BEGIN
    -- For store_products, we need to update supplier_products via join
    -- This version handles both tables for supplier role, and only wholesale for simplicity
    UPDATE supplier_products 
    SET category_id = p_category_id, product_name = p_product_name, 
        description = p_description, image_path = p_image_path, 
        wholesale_price = p_wholesale_price 
    WHERE supplier_product_id = p_product_id;
    SELECT ROW_COUNT() AS affected_rows;
END$$

CREATE  PROCEDURE `sp_product_categories_get` ()   BEGIN
    SELECT category_id, category_name FROM product_categories ORDER BY category_name;
END$$

CREATE  PROCEDURE `sp_roles_create` (IN `p_role_name` VARCHAR(50), IN `p_description` VARCHAR(255))   BEGIN
    DECLARE v_exists INT DEFAULT 0;

    SELECT COUNT(*) INTO v_exists 
    FROM roles 
    WHERE LOWER(role_name) = LOWER(TRIM(p_role_name));

    IF v_exists > 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'A role with this name already exists.';
    END IF;

    INSERT INTO roles (role_name, description) 
    VALUES (TRIM(p_role_name), p_description);

    SELECT LAST_INSERT_ID() AS role_id;
END$$

CREATE  PROCEDURE `sp_roles_delete` (IN `p_role_id` INT)   BEGIN
    DECLARE v_role_name VARCHAR(50);
    DECLARE v_count INT DEFAULT 0;

    SELECT role_name INTO v_role_name 
    FROM roles 
    WHERE role_id = p_role_id 
    LIMIT 1;

    IF v_role_name IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Role not found.';
    END IF;

    -- Bawal burahin ang core system roles
    IF LOWER(TRIM(v_role_name)) IN ('administrator', 'cashier staff', 'inventory staff', 'supplier') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This role is used by the system and cannot be deleted.';
    END IF;

    -- Bawal burahin kapag may naka-assign pang active users
    SELECT COUNT(*) INTO v_count 
    FROM users 
    WHERE role_id = p_role_id;

    IF v_count > 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Cannot delete: user account(s) still use this role. Reassign or remove them first.';
    END IF;

    DELETE FROM roles WHERE role_id = p_role_id;

    SELECT ROW_COUNT() AS affected_rows;
END$$

CREATE  PROCEDURE `sp_roles_fetch_all` (IN `p_search` VARCHAR(255))   BEGIN
    DECLARE v_search VARCHAR(255);
    SET v_search = CONCAT('%', COALESCE(p_search, ''), '%');

    SELECT r.role_id, r.role_name, r.description,
           COUNT(u.user_id) AS user_count
    FROM roles r
    LEFT JOIN users u ON u.role_id = r.role_id
    WHERE r.role_name LIKE v_search OR r.description LIKE v_search
    GROUP BY r.role_id, r.role_name, r.description
    ORDER BY r.role_name ASC;
END$$

CREATE  PROCEDURE `sp_roles_get_supplier_role_id` ()   BEGIN
    SELECT role_id FROM roles WHERE LOWER(role_name) = 'supplier' LIMIT 1;
END$$

CREATE  PROCEDURE `sp_roles_is_admin` (IN `p_user_id` INT)   BEGIN
    SELECT r.role_name 
    FROM users u 
    INNER JOIN roles r ON u.role_id = r.role_id 
    WHERE u.user_id = p_user_id 
    LIMIT 1;
END$$

CREATE  PROCEDURE `sp_roles_update` (IN `p_role_id` INT, IN `p_role_name` VARCHAR(50), IN `p_description` VARCHAR(255))   BEGIN
    DECLARE v_current_name VARCHAR(50);
    DECLARE v_current_name_lower VARCHAR(50);
    DECLARE v_new_name_lower VARCHAR(50);
    DECLARE v_duplicate INT DEFAULT 0;

    SELECT role_name INTO v_current_name 
    FROM roles 
    WHERE role_id = p_role_id 
    LIMIT 1;

    IF v_current_name IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Role not found.';
    END IF;

    SET v_current_name_lower = LOWER(TRIM(v_current_name));
    SET v_new_name_lower = LOWER(TRIM(p_role_name));

    -- Hindi pwedeng palitan ang pangalan ng default roles
    IF v_current_name_lower IN ('administrator', 'cashier staff', 'inventory staff', 'supplier') 
       AND v_new_name_lower != v_current_name_lower THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'This role\'s name is protected and cannot be changed.';
    END IF;

    -- Siguraduhing walang kaparehong role name
    IF v_new_name_lower != v_current_name_lower THEN
        SELECT COUNT(*) INTO v_duplicate 
        FROM roles 
        WHERE LOWER(role_name) = v_new_name_lower AND role_id != p_role_id;

        IF v_duplicate > 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A role with this name already exists.';
        END IF;
    END IF;

    UPDATE roles 
    SET role_name = TRIM(p_role_name),
        description = p_description 
    WHERE role_id = p_role_id;

    SELECT ROW_COUNT() AS affected_rows;
END$$

CREATE  PROCEDURE `sp_sales_add_item_with_fifo` (IN `p_sale_id` INT, IN `p_store_product_id` INT, IN `p_quantity` INT, IN `p_unit_price` DECIMAL(10,2))   BEGIN
    DECLARE v_done INT DEFAULT FALSE;
    DECLARE v_batch_id INT;
    DECLARE v_batch_qty INT;
    DECLARE v_remaining INT DEFAULT p_quantity;
    DECLARE v_deduct INT DEFAULT 0;
    DECLARE v_total_available INT DEFAULT 0;

    -- FIFO Cursor: pinakalumang expiration date at received date muna
    DECLARE cur_batches CURSOR FOR
        SELECT batch_id, quantity_in_stock
        FROM product_batches
        WHERE store_product_id = p_store_product_id AND quantity_in_stock > 0
        ORDER BY expiration_date ASC, received_date ASC, batch_id ASC;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

    -- Siguraduhing may sapat na physical stock bago magbawas
    SELECT COALESCE(SUM(quantity_in_stock), 0) INTO v_total_available
    FROM product_batches
    WHERE store_product_id = p_store_product_id AND quantity_in_stock > 0;

    IF v_total_available < p_quantity THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Insufficient physical stock for this item.';
    END IF;

    -- I-insert ang item sa receipt (sales_items)
    INSERT INTO sales_items (sale_id, store_product_id, quantity, unit_price)
    VALUES (p_sale_id, p_store_product_id, p_quantity, p_unit_price);

    -- Simulan ang FIFO deduction loop sa mga batches
    OPEN cur_batches;
    batch_loop: LOOP
        FETCH cur_batches INTO v_batch_id, v_batch_qty;
        IF v_done THEN
            LEAVE batch_loop;
        END IF;

        IF v_remaining > 0 THEN
            IF v_remaining >= v_batch_qty THEN
                SET v_deduct = v_batch_qty;
            ELSE
                SET v_deduct = v_remaining;
            END IF;

            SET v_remaining = v_remaining - v_deduct;

            UPDATE product_batches
            SET quantity_in_stock = quantity_in_stock - v_deduct
            WHERE batch_id = v_batch_id;
        END IF;

        IF v_remaining <= 0 THEN
            LEAVE batch_loop;
        END IF;
    END LOOP;
    CLOSE cur_batches;

    IF v_remaining > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Batch allocation error: remaining quantity could not be satisfied.';
    END IF;
END$$

CREATE  PROCEDURE `sp_sales_create` (IN `p_user_id` INT, IN `p_payment_method_id` INT, IN `p_reference_number` VARCHAR(50), IN `p_tax_amount` DECIMAL(10,2), IN `p_amount` DECIMAL(10,2))   BEGIN
    DECLARE v_staff_id INT;
    DECLARE v_next_id INT DEFAULT 1;
    DECLARE v_txn_number VARCHAR(50);
    DECLARE v_sale_id INT;

    -- 1. Kunin ang staff_id base sa user_id
    SELECT staff_id INTO v_staff_id 
    FROM staffs 
    WHERE user_id = p_user_id 
    LIMIT 1;

    IF v_staff_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Authorized staff record not found.';
    END IF;

    -- 2. I-compute ang susunod na transaction number
    SELECT COALESCE(MAX(sale_id), 0) + 1 INTO v_next_id FROM sales;

    IF p_payment_method_id = 2 AND p_reference_number IS NOT NULL AND TRIM(p_reference_number) != '' THEN
        SET v_txn_number = CONCAT('GCASH-', TRIM(p_reference_number));
    ELSE
        SET v_txn_number = CONCAT('TXN-', v_next_id, '-', YEAR(CURDATE()));
    END IF;

    -- 3. I-save ang transaksyon sa sales table
    INSERT INTO sales (
        staff_id, 
        payment_method_id, 
        transaction_number, 
        tax_amount, 
        amount, 
        sale_date
    )
    VALUES (
        v_staff_id, 
        p_payment_method_id, 
        v_txn_number, 
        p_tax_amount, 
        p_amount, 
        NOW()
    );

    SET v_sale_id = LAST_INSERT_ID();

    -- Ibalik ang nabuong sale_id at transaction_number
    SELECT v_sale_id AS sale_id, v_txn_number AS transaction_number;
END$$

CREATE  PROCEDURE `sp_sales_fetch_all` (IN `p_search` VARCHAR(255), IN `p_start_date` VARCHAR(20), IN `p_end_date` VARCHAR(20))   BEGIN
    SET SESSION group_concat_max_len = 100000;

    SELECT
        s.sale_id,
        s.transaction_number,
        CONCAT(st.first_name, ' ', st.last_name) AS staff_name,
        s.sale_date,
        pm.method_name AS payment_method,
        s.amount AS amount_received,
        CASE
            WHEN pm.method_name = 'GCash' AND s.transaction_number LIKE 'GCASH-%'
            THEN SUBSTRING(s.transaction_number, 7)
            ELSE NULL
        END AS reference_number,
        COALESCE(SUM(si.quantity * si.unit_price), 0.00) AS subtotal,
        s.tax_amount,
        COALESCE(SUM(si.quantity * si.unit_price), 0.00) + s.tax_amount AS total_amount,
        GROUP_CONCAT(
            CONCAT_WS('||', sp.product_name, si.unit_price, si.quantity, si.quantity * si.unit_price)
            SEPARATOR ';;'
        ) AS items
    FROM sales s
    LEFT JOIN staffs st ON st.staff_id = s.staff_id
    LEFT JOIN payment_methods pm ON pm.payment_method_id = s.payment_method_id
    LEFT JOIN sales_items si ON si.sale_id = s.sale_id
    LEFT JOIN store_products stp ON stp.store_product_id = si.store_product_id
    LEFT JOIN supplier_products sp ON sp.supplier_product_id = stp.supplier_product_id
    WHERE
        (p_search IS NULL OR p_search = '' OR (
            s.transaction_number LIKE CONCAT('%', p_search, '%')
            OR CONCAT(st.first_name, ' ', st.last_name) LIKE CONCAT('%', p_search, '%')
            OR sp.product_name LIKE CONCAT('%', p_search, '%')
            OR DATE_FORMAT(s.sale_date, '%Y-%m-%d') LIKE CONCAT('%', p_search, '%')
        ))
        AND (
            (p_start_date IS NULL OR p_start_date = '' OR p_end_date IS NULL OR p_end_date = '')
            OR (DATE(s.sale_date) BETWEEN p_start_date AND p_end_date)
        )
    GROUP BY s.sale_id, s.transaction_number, st.first_name, st.last_name, s.sale_date, pm.method_name, s.amount, s.tax_amount
    ORDER BY s.sale_date DESC;
END$$

CREATE  PROCEDURE `sp_staff_create` (IN `p_first_name` VARCHAR(50), IN `p_middle_name` VARCHAR(50), IN `p_last_name` VARCHAR(50), IN `p_email` VARCHAR(100), IN `p_phone` VARCHAR(20), IN `p_hire_date` DATE, IN `p_username` VARCHAR(50), IN `p_password_hash` VARCHAR(255), IN `p_role_name` VARCHAR(50))   BEGIN
    DECLARE v_role_id INT;
    DECLARE v_user_id INT;
    DECLARE v_staff_id INT;
    DECLARE v_exists INT DEFAULT 0;

    -- Check if username already exists
    SELECT COUNT(*) INTO v_exists FROM users WHERE username = p_username;
    IF v_exists > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Username already exists';
    END IF;

    -- Check if email already exists
    IF p_email IS NOT NULL AND TRIM(p_email) != '' THEN
        SELECT COUNT(*) INTO v_exists FROM staffs WHERE email = TRIM(p_email);
        IF v_exists > 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Email already exists';
        END IF;
    END IF;

    -- Hanapin ang role_id
    SELECT role_id INTO v_role_id 
    FROM roles 
    WHERE LOWER(role_name) = LOWER(TRIM(p_role_name)) 
    LIMIT 1;

    IF v_role_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Role not found';
    END IF;

    START TRANSACTION;

    INSERT INTO users (username, password_hash, role_id, is_active)
    VALUES (p_username, p_password_hash, v_role_id, 1);

    SET v_user_id = LAST_INSERT_ID();

    INSERT INTO staffs (user_id, first_name, middle_name, last_name, email, phone, hire_date)
    VALUES (
        v_user_id, 
        p_first_name, 
        NULLIF(TRIM(p_middle_name), ''), 
        p_last_name, 
        NULLIF(TRIM(p_email), ''), 
        NULLIF(TRIM(p_phone), ''), 
        p_hire_date
    );

    SET v_staff_id = LAST_INSERT_ID();

    COMMIT;

    -- Ibalik ang record ng bagong gawang staff
    SELECT s.staff_id, s.user_id, s.first_name, s.middle_name, s.last_name, 
           s.email, s.phone, s.hire_date, s.created_at,
           u.username, u.is_active, u.role_id, r.role_name
    FROM staffs s
    JOIN users u ON s.user_id = u.user_id
    JOIN roles r ON u.role_id = r.role_id
    WHERE s.staff_id = v_staff_id 
    LIMIT 1;
END$$

CREATE  PROCEDURE `sp_staff_fetch_all` (IN `p_search` VARCHAR(255))   BEGIN
    DECLARE v_search VARCHAR(255);
    SET v_search = CONCAT('%', COALESCE(p_search, ''), '%');

    SELECT s.staff_id, s.user_id, s.first_name, s.middle_name, s.last_name, 
           s.email, s.phone, s.hire_date, s.created_at,
           u.username, u.is_active, u.role_id, r.role_name
    FROM staffs s
    JOIN users u ON s.user_id = u.user_id
    JOIN roles r ON u.role_id = r.role_id
    WHERE u.is_active = 1
    AND (
        s.first_name LIKE v_search 
        OR s.last_name LIKE v_search 
        OR s.email LIKE v_search 
        OR u.username LIKE v_search 
        OR r.role_name LIKE v_search
    )
    ORDER BY s.staff_id DESC 
    LIMIT 100;
END$$

CREATE  PROCEDURE `sp_staff_get_by_id` (IN `p_staff_id` INT)   BEGIN
    SELECT s.staff_id, s.user_id, s.first_name, s.middle_name, s.last_name, 
           s.email, s.phone, s.hire_date, s.created_at,
           u.username, u.is_active, u.role_id, r.role_name
    FROM staffs s
    JOIN users u ON s.user_id = u.user_id
    JOIN roles r ON u.role_id = r.role_id
    WHERE s.staff_id = p_staff_id 
    LIMIT 1;
END$$

CREATE  PROCEDURE `sp_staff_roles_get` ()   BEGIN
    SELECT role_id, role_name 
    FROM roles 
    WHERE LOWER(role_name) != 'supplier' 
    ORDER BY role_name ASC;
END$$

CREATE  PROCEDURE `sp_staff_soft_delete` (IN `p_staff_id` INT)   BEGIN
    UPDATE users u
    JOIN staffs s ON s.user_id = u.user_id
    SET u.is_active = 0
    WHERE s.staff_id = p_staff_id
    AND u.is_active = 1;

    SELECT ROW_COUNT() AS affected_rows;
END$$

CREATE  PROCEDURE `sp_staff_update` (IN `p_staff_id` INT, IN `p_first_name` VARCHAR(50), IN `p_middle_name` VARCHAR(50), IN `p_last_name` VARCHAR(50), IN `p_email` VARCHAR(100), IN `p_phone` VARCHAR(20), IN `p_hire_date` DATE, IN `p_username` VARCHAR(50), IN `p_password_hash` VARCHAR(255), IN `p_role_name` VARCHAR(50))   BEGIN
    DECLARE v_user_id INT;
    DECLARE v_role_id INT;
    DECLARE v_exists INT DEFAULT 0;

    -- Siguraduhing existing ang staff at kunin ang user_id
    SELECT user_id INTO v_user_id FROM staffs WHERE staff_id = p_staff_id LIMIT 1;
    IF v_user_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Staff member not found';
    END IF;

    -- Check if username is taken by another user
    SELECT COUNT(*) INTO v_exists FROM users WHERE username = p_username AND user_id != v_user_id;
    IF v_exists > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Username already exists';
    END IF;

    -- Check if email is taken by another staff
    IF p_email IS NOT NULL AND TRIM(p_email) != '' THEN
        SELECT COUNT(*) INTO v_exists FROM staffs WHERE email = TRIM(p_email) AND staff_id != p_staff_id;
        IF v_exists > 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Email already exists';
        END IF;
    END IF;

    -- Hanapin ang role_id
    SELECT role_id INTO v_role_id 
    FROM roles 
    WHERE LOWER(role_name) = LOWER(TRIM(p_role_name)) 
    LIMIT 1;

    IF v_role_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Role not found';
    END IF;

    START TRANSACTION;

    UPDATE staffs
    SET first_name = p_first_name,
        middle_name = NULLIF(TRIM(p_middle_name), ''),
        last_name = p_last_name,
        email = NULLIF(TRIM(p_email), ''),
        phone = NULLIF(TRIM(p_phone), ''),
        hire_date = p_hire_date
    WHERE staff_id = p_staff_id;

    UPDATE users
    SET username = p_username,
        role_id = v_role_id
    WHERE user_id = v_user_id;

    IF p_password_hash IS NOT NULL AND TRIM(p_password_hash) != '' THEN
        UPDATE users
        SET password_hash = p_password_hash
        WHERE user_id = v_user_id;
    END IF;

    COMMIT;

    -- Ibalik ang updated details
    SELECT s.staff_id, s.user_id, s.first_name, s.middle_name, s.last_name, 
           s.email, s.phone, s.hire_date, s.created_at,
           u.username, u.is_active, u.role_id, r.role_name
    FROM staffs s
    JOIN users u ON s.user_id = u.user_id
    JOIN roles r ON u.role_id = r.role_id
    WHERE s.staff_id = p_staff_id 
    LIMIT 1;
END$$

CREATE  PROCEDURE `sp_suppliers_add` (IN `p_username` VARCHAR(100), IN `p_password_hash` VARCHAR(255), IN `p_supplier_name` VARCHAR(255), IN `p_contact_person` VARCHAR(255), IN `p_email` VARCHAR(255), IN `p_phone` VARCHAR(50), IN `p_street_address` TEXT, IN `p_postal_code` VARCHAR(20), IN `p_role_id` INT)   BEGIN
    DECLARE v_user_id INT;
    DECLARE v_exists INT DEFAULT 0;
    
    -- Check duplicate username
    SELECT COUNT(*) INTO v_exists FROM users WHERE username = p_username;
    IF v_exists > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Username already exists.';
    END IF;
    
    START TRANSACTION;
    
    INSERT INTO users (role_id, username, password_hash, is_active) 
    VALUES (p_role_id, p_username, p_password_hash, 1);
    
    SET v_user_id = LAST_INSERT_ID();
    
    INSERT INTO suppliers (user_id, supplier_name, contact_person, email, phone, street_address, postal_code, is_active)
    VALUES (v_user_id, p_supplier_name, p_contact_person, p_email, p_phone, p_street_address, p_postal_code, 1);
    
    COMMIT;
    
    SELECT LAST_INSERT_ID() AS supplier_id, v_user_id AS user_id;
END$$

CREATE  PROCEDURE `sp_suppliers_fetch` (IN `p_search` VARCHAR(255))   BEGIN
    IF p_search IS NULL OR p_search = '' THEN
        SELECT * FROM suppliers WHERE is_active = 1 ORDER BY supplier_name ASC;
    ELSE
        SET @search_term = CONCAT('%', p_search, '%');
        SELECT * FROM suppliers
        WHERE is_active = 1 
        AND (supplier_name LIKE @search_term 
            OR contact_person LIKE @search_term 
            OR email LIKE @search_term 
            OR phone LIKE @search_term 
            OR street_address LIKE @search_term)
        ORDER BY supplier_name ASC;
    END IF;
END$$

CREATE  PROCEDURE `sp_suppliers_get_user_id` (IN `p_supplier_id` INT)   BEGIN
    SELECT user_id FROM suppliers WHERE supplier_id = p_supplier_id LIMIT 1;
END$$

CREATE  PROCEDURE `sp_suppliers_soft_delete` (IN `p_supplier_id` INT)   BEGIN
    UPDATE suppliers SET is_active = 0 WHERE supplier_id = p_supplier_id AND is_active = 1;
    SELECT ROW_COUNT() AS affected_rows;
END$$

CREATE  PROCEDURE `sp_suppliers_update` (IN `p_supplier_id` INT, IN `p_user_id` INT, IN `p_username` VARCHAR(100), IN `p_password_hash` VARCHAR(255), IN `p_supplier_name` VARCHAR(255), IN `p_contact_person` VARCHAR(255), IN `p_email` VARCHAR(255), IN `p_phone` VARCHAR(50), IN `p_street_address` TEXT, IN `p_postal_code` VARCHAR(20))   BEGIN
    DECLARE v_duplicate INT DEFAULT 0;
    
    IF p_username IS NOT NULL AND p_username != '' THEN
        SELECT COUNT(*) INTO v_duplicate FROM users 
        WHERE username = p_username AND user_id != p_user_id;
        
        IF v_duplicate > 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Username already exists.';
        END IF;
        
        UPDATE users SET username = p_username WHERE user_id = p_user_id;
    END IF;
    
    IF p_password_hash IS NOT NULL AND p_password_hash != '' THEN
        UPDATE users SET password_hash = p_password_hash WHERE user_id = p_user_id;
    END IF;
    
    UPDATE suppliers 
    SET supplier_name = p_supplier_name, 
        contact_person = p_contact_person, 
        email = p_email, 
        phone = p_phone, 
        street_address = p_street_address, 
        postal_code = p_postal_code 
    WHERE supplier_id = p_supplier_id AND is_active = 1;
    
    SELECT ROW_COUNT() AS affected_rows;
END$$

CREATE  PROCEDURE `sp_supplier_products_add` (IN `p_supplier_id` INT, IN `p_category_id` INT, IN `p_product_name` VARCHAR(255), IN `p_description` TEXT, IN `p_image_path` VARCHAR(255), IN `p_wholesale_price` DECIMAL(10,2))   BEGIN
    INSERT INTO supplier_products (supplier_id, category_id, product_name, description, image_path, wholesale_price, is_active)
    VALUES (p_supplier_id, p_category_id, p_product_name, p_description, p_image_path, p_wholesale_price, 1);
    SELECT LAST_INSERT_ID() AS supplier_product_id;
END$$

CREATE  PROCEDURE `sp_users_find_by_username` (IN `p_username` VARCHAR(50))   BEGIN
    DECLARE v_user_id INT;

    -- 1. Hanapin ang active user gamit ang username (is_active = 1)
    SELECT user_id INTO v_user_id 
    FROM users 
    WHERE username = p_username AND is_active = 1 
    LIMIT 1;

    -- 2. Kung nahanap, i-update agad ang last_login timestamp
    IF v_user_id IS NOT NULL THEN
        UPDATE users SET last_login = NOW() WHERE user_id = v_user_id;
    END IF;

    -- 3. Ibalik ang kumpletong detalye ng user, role, staff, at supplier
    SELECT 
        u.user_id,
        u.role_id,
        u.username,
        u.password_hash,
        u.is_active,
        u.last_login,
        u.created_at,
        r.role_name,
        st.first_name,
        st.last_name,
        sp.supplier_id,
        sp.supplier_name,
        sp.contact_person,
        sp.email AS supplier_email,
        sp.phone AS supplier_phone
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.role_id
    LEFT JOIN staffs st ON u.user_id = st.user_id
    LEFT JOIN suppliers sp ON u.user_id = sp.user_id
    WHERE u.user_id = v_user_id
    LIMIT 1;
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
(2, 3, NULL, 2, '1245617893124', 5000.00, 'Paid business insurance', '2026-09-14 07:07:05'),
(3, 1, NULL, 2, '1546789432165', 500.00, 'Paid operating expenses', '2026-09-22 11:58:24'),
(4, 6, 8, 1, 'BATCH-33-001', 28.00, 'Inventory restock: BATCH-33-001', '2026-09-23 10:09:23'),
(5, 6, 4, 1, 'BATCH-14-001', 60.00, 'Inventory restock: BATCH-14-001', '2026-09-23 10:09:23'),
(6, 6, 1, 1, 'BATCH-1-001', 1500.00, 'Inventory restock: BATCH-1-001', '2026-09-23 10:10:03'),
(7, 6, 1, 1, 'BATCH-2-001', 50000.00, 'Inventory restock: BATCH-2-001', '2026-09-23 10:10:34');

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
('1006', 'Binondo, Manila', 'Metro Manila', 'Philippines'),
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
(10, 8, 'BATCH-8-001', 95, 16.00, '2027-03-10', '2026-08-03'),
(11, 9, 'BATCH-9-001', 150, 7.00, '2027-03-15', '2026-08-05'),
(12, 10, 'BATCH-10-001', 80, 18.00, '2027-04-10', '2026-08-06'),
(13, 10, 'BATCH-10-002', 70, 18.50, '2027-05-10', '2026-08-20'),
(14, 11, 'BATCH-11-001', 50, 32.00, '2028-01-01', '2026-08-10'),
(15, 12, 'BATCH-12-001', 23, 16.00, '2028-01-05', '2026-08-11'),
(16, 13, 'BATCH-13-001', 30, 60.00, '2028-02-01', '2026-08-12'),
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
(36, 32, 'BATCH-32-001', 98, 28.00, '2027-10-05', '2026-09-07'),
(37, 33, 'BATCH-33-001', 150, 3.00, '2027-10-10', '2026-09-08'),
(38, 33, 'BATCH-33-002', 150, 3.10, '2027-11-10', '2026-09-16'),
(39, 34, 'BATCH-34-001', 100, 5.00, '2027-10-12', '2026-09-09'),
(40, 35, 'BATCH-35-001', 100, 5.00, '2027-10-15', '2026-09-10'),
(66, 32, 'BATCH-33-001', 0, 28.00, '2026-11-27', '2026-09-23'),
(67, 13, 'BATCH-14-001', 0, 60.00, '2026-11-27', '2026-09-23'),
(68, 36, 'BATCH-1-001', 3, 500.00, '2027-01-23', '2026-09-23'),
(69, 36, 'BATCH-2-001', 93, 500.00, '2026-12-16', '2026-09-23');

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
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `sale_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sales`
--

INSERT INTO `sales` (`sale_id`, `staff_id`, `payment_method_id`, `transaction_number`, `tax_amount`, `amount`, `sale_date`) VALUES
(1, 1, 1, 'TXN-1-2026', 21.00, 231.00, '2026-09-20 15:03:10'),
(2, 1, 2, 'GCASH-8192307130291', 26.00, 286.00, '2026-09-20 15:05:04'),
(3, 1, 1, 'TXN-3-2026', 31.20, 343.20, '2026-09-22 11:55:05'),
(4, 1, 1, 'TXN-4-2026', 136.00, 1496.00, '2026-09-22 12:05:05'),
(5, 1, 1, 'TXN-5-2026', 20.80, 228.80, '2026-09-23 05:01:54'),
(6, 1, 1, 'TXN-6-2026', 64.90, 713.90, '2026-09-23 13:10:53'),
(7, 1, 1, 'TXN-7-2026', 365.00, 5000.00, '2026-09-23 13:31:38');

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

--
-- Dumping data for table `sales_items`
--

INSERT INTO `sales_items` (`sales_item_id`, `sale_id`, `store_product_id`, `quantity`, `unit_price`) VALUES
(1, 1, 12, 7, 30.00),
(2, 2, 12, 5, 52.00),
(3, 3, 12, 6, 52.00),
(4, 4, 13, 16, 85.00),
(5, 5, 12, 4, 52.00),
(6, 6, 32, 3, 38.00),
(7, 6, 8, 5, 22.00),
(8, 6, 13, 5, 85.00),
(9, 7, 12, 5, 30.00),
(10, 7, 36, 7, 500.00);

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
(3, 3, 'Juans', NULL, 'Cruz', 'inventory@example.com', '09170000003', '2026-09-11', '2026-09-11 13:45:31');

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
(35, 35, 8.00, 1, '2026-09-13 02:56:12'),
(36, 36, 500.00, 1, '2026-09-23 09:23:10');

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
(1, 4, 'The Universal Robina Corporation', 'URC Sales', 'sales@urc.com.ph', '09170000001', 'URC Compound Pasig', '1000', '2026-09-13 02:56:12', 1),
(2, 5, 'Liwayway Marketing Corp', 'Oishi Sales', 'sales@oishi.com.ph', '09170000002', 'Oishi Factory Laguna', '4027', '2026-09-13 02:56:12', 1),
(3, 6, 'Coca-Cola Beverages Philippines', 'Coke Sales', 'sales@coca-cola.com.ph', '09170000003', 'Coke Plant Laguna', '4027', '2026-09-13 02:56:12', 1),
(4, 7, 'Century Pacific Food Inc', 'Century Sales', 'sales@centurypacific.com.ph', '09170000004', 'Century Pasig', '1000', '2026-09-13 02:56:12', 1),
(5, 8, 'Nutri-Asia Inc', 'Nutri-Asia Sales', 'sales@nutriasia.com.ph', '09170000005', 'Nutri-Asia Cabuyao', '4027', '2026-09-13 02:56:12', 1),
(6, 9, 'Procter & Gamble Philippines', 'P&G Sales', 'sales@pg.com.ph', '09170000006', 'P&G BGC Taguig', '1000', '2026-09-13 02:56:12', 1),
(7, 10, 'Unilever Philippines', 'Unilever Sales', 'sales@unilever.com.ph', '09170000007', 'Unilever BGC', '1000', '2026-09-13 02:56:12', 0),
(8, 11, 'Nestle Philippines', 'Nestle Sales', 'sales@nestle.com.ph', '09170000008', 'Nestle Cabuyao', '4027', '2026-09-13 02:56:12', 1),
(9, 12, 'Zest-O Corporation', 'Zest-O Sales', 'sales@zesto.com.ph', '09170000009', 'Zest-O Caloocan', '1000', '2026-09-13 02:56:12', 1),
(10, 13, 'Colgate-Palmolive Philippines', 'Colgate Sales', 'sales@colgate.com.ph', '09170000010', 'Colgate Mkt', '1000', '2026-09-13 02:56:12', 1),
(11, 14, 'Super 8 Grocery Warehouse', 'Corporate Customer Care', 'contact@super8.ph', '0995-0946590', '11th Floor, UnionBank Centre-Manila (formerly G.A. Cu-Unjieng Centre), 208 Dasmariñas Street corner Quintin Paredes Street', '1006', '2026-09-23 10:18:21', 1),
(12, 15, 'Annabelle Chucky Dolled', 'Annabelle Rama', 'annabelle@gmail.com', '09223344556', 'URC Compound Pasig', '4027', '2026-10-03 11:54:47', 1);

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
(35, 8, 7, 'Great Taste White Coffee 26g', 'White coffee', '/uploads/products/great_taste_white.jpg', 5.00, 1, '2026-09-13 02:56:12'),
(36, 1, 5, '555 Sardines Tomato 155g', 'sddsadasd', '/uploads/products/product_1790141604_a95b69c4.png', 500.00, 1, '2026-09-23 05:33:24'),
(37, 10, 1, 'sdddsdsd', 'Green tea apple', '/uploads/products/product_1790153273_d0c084ae.png', 321.00, 1, '2026-09-23 08:47:53'),
(38, 12, 2, 'Annabelle Chuckiest', 'Chocolate Milk drink for kids', '/uploads/products/product_1791034621_bd59ef7d.jpg', 39.00, 0, '2026-10-03 12:05:53'),
(39, 12, 2, 'Aljon Orange Beverage', 'brand new', '/uploads/products/product_1791037341_9a4256e7.jpg', 111.00, 1, '2026-10-03 14:22:21'),
(40, 12, 3, 'Martin 123', 'On Demand', '/uploads/products/product_1791037605_d81b1077.jpg', 222.00, 1, '2026-10-03 14:26:45');

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
(1, 1, 'admin_user', '$2y$10$R45/Q5DHFgNMfeazP1HQa.UZ8T0zjcsHt5piLphwtUmhapNujcU9y', 1, '2026-10-04 06:07:01', '2026-09-11 13:45:31'),
(2, 2, 'cashier_user', '$2y$10$rqgUmszPiT3xQWGntSnSHO4jj6UFw7QyMJC0L1fyi/OAqb4gv3QGS', 1, NULL, '2026-09-11 13:45:31'),
(3, 3, 'inventory_user', '$2y$10$OMPOrqQLRkYwhH0SqnSq.eiRP8rMVX/areg3XJE0YH.oW6K2OSak2', 1, NULL, '2026-09-11 13:45:31'),
(4, 4, 'urc_supplier', '$2y$10$po1WMuDgZU3KgkBXJ2190eRkEj6qJ.QCTUQok8v9kRPna9k75z/si', 1, NULL, '2026-09-13 06:42:24'),
(5, 4, 'oishi_supplier', '$2y$10$M/uHAdCkWeYdIKmWlnJFnuFZj1/j1UY6BFuAUpBkeDVAQdCqTjwGu', 1, NULL, '2026-09-13 06:42:24'),
(6, 4, 'coke_supplier', '$2y$10$ksUQPviznhUk3u9mPXRN4OmkySW2sIYxRLi2FTYYNX/07W2Jwul4O', 1, NULL, '2026-09-13 06:42:24'),
(7, 4, 'century_supplier', '$2y$10$CRN0fPyK65o2QPIg0j8BvOFlTKDMkiWaid0U4SdPLW2ewETDBIhbm', 1, '2026-10-03 04:15:10', '2026-09-13 06:42:25'),
(8, 4, 'nutriasia_supplier', '$2y$10$s2mSP31UXQ/2q78FPhh1WOWwzqFel7dT0W8ewyfvtFsk/gN7XiH.C', 1, NULL, '2026-09-13 06:42:25'),
(9, 4, 'pg_supplier', '$2y$10$gFvSz7RitCPS8SgSvrp32u21.iiBKXv5ZFQA/dnnBCM3HORrFu/c2', 1, NULL, '2026-09-13 06:42:25'),
(10, 4, 'unilever_supplier', '$2y$10$A/5.2.ayAbXV8e0pKIVEV.2iocwLFuzuCrq14JdUFGqsNbgj4r/Ye', 1, NULL, '2026-09-13 06:42:25'),
(11, 4, 'nestle_supplier', '$2y$10$3FpFQy82CNz8Ta6Ji16xk.CQqEXckkjNlIb9/XiMPSiNTs6x3yhFW', 1, NULL, '2026-09-13 06:42:25'),
(12, 4, 'zesto_supplier', '$2y$10$nbwIU05lzY73/5LgHBFTEOAZw5RgmLinmj5YgxFlr94vnEibPQGI6', 1, NULL, '2026-09-13 06:42:25'),
(13, 4, 'colgate_supplier', '$2y$10$uOHy/nWPdtIL/LfT3bjtt..err7wDsLR31/1nvOfWGnWWfEKMs4uW', 1, NULL, '2026-09-13 06:42:25'),
(14, 4, 'super8_user', '$2y$10$icAxUiqdOpWTe9lT8z5DF.ou4zMktdcQpH9V.MwUwhypykAkosCPW', 1, NULL, '2026-09-23 10:18:21'),
(15, 4, 'annabelle_ph', '$2y$10$lr66Ke8wPzMm4vBgzn8xTenY59h.WUj2mhHyuMCtwfbJUWwxBlGyi', 1, '2026-10-04 06:32:02', '2026-10-03 11:54:47');

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

CREATE ALGORITHM=UNDEFINED  SQL SECURITY DEFINER VIEW `vw_sales_summary`  AS SELECT `s`.`sale_id` AS `sale_id`, `s`.`staff_id` AS `staff_id`, `s`.`payment_method_id` AS `payment_method_id`, `s`.`transaction_number` AS `transaction_number`, coalesce(sum(`si`.`quantity` * `si`.`unit_price`),0.00) AS `subtotal`, `s`.`tax_amount` AS `tax_amount`, coalesce(sum(`si`.`quantity` * `si`.`unit_price`),0.00) + `s`.`tax_amount` AS `total_amount`, `s`.`sale_date` AS `sale_date` FROM (`sales` `s` left join `sales_items` `si` on(`s`.`sale_id` = `si`.`sale_id`)) GROUP BY `s`.`sale_id`, `s`.`staff_id`, `s`.`payment_method_id`, `s`.`transaction_number`, `s`.`tax_amount`, `s`.`sale_date` ;

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
  MODIFY `expense_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

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
  MODIFY `batch_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=70;

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
  MODIFY `sale_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `sales_items`
--
ALTER TABLE `sales_items`
  MODIFY `sales_item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `staffs`
--
ALTER TABLE `staffs`
  MODIFY `staff_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `store_products`
--
ALTER TABLE `store_products`
  MODIFY `store_product_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `supplier_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `supplier_products`
--
ALTER TABLE `supplier_products`
  MODIFY `supplier_product_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

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
