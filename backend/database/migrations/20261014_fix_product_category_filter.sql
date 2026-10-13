DROP PROCEDURE IF EXISTS `sp_products_get`;
DELIMITER $$
CREATE PROCEDURE `sp_products_get` (
    IN `p_role` VARCHAR(20),
    IN `p_supplier_id` INT,
    IN `p_search` VARCHAR(255),
    IN `p_category_ids` VARCHAR(255),
    IN `p_is_all` INT
)
BEGIN
    IF LOWER(TRIM(p_role)) = 'supplier' OR p_is_all = 1 THEN
        SELECT
            sp.supplier_product_id AS id,
            sp.supplier_product_id,
            sp.supplier_id,
            COALESCE(s.supplier_name, 'Unknown Supplier') AS supplier_name,
            sp.category_id,
            COALESCE((SELECT GROUP_CONCAT(DISTINCT pc2.category_name ORDER BY pc2.category_name SEPARATOR ', ') FROM supplier_product_categories spc JOIN product_categories pc2 ON pc2.category_id = spc.category_id WHERE spc.supplier_product_id = sp.supplier_product_id), pc.category_name, 'General') AS category,
            COALESCE((SELECT GROUP_CONCAT(DISTINCT pc2.category_name ORDER BY pc2.category_name SEPARATOR ', ') FROM supplier_product_categories spc JOIN product_categories pc2 ON pc2.category_id = spc.category_id WHERE spc.supplier_product_id = sp.supplier_product_id), pc.category_name, 'General') AS category_name,
            COALESCE((SELECT GROUP_CONCAT(spc.category_id ORDER BY spc.category_id SEPARATOR ',') FROM supplier_product_categories spc WHERE spc.supplier_product_id = sp.supplier_product_id), CAST(sp.category_id AS CHAR)) AS category_ids,
            sp.product_name AS name,
            sp.product_name AS prodname,
            sp.product_name,
            sp.description,
            sp.image_path,
            COALESCE(sp.wholesale_price, 0.00) AS price,
            COALESCE(sp.wholesale_price, 0.00) AS wholesale_price,
            COALESCE(sp.wholesale_price, 0.00) AS selling_price,
            COALESCE(sp.wholesale_price, 0.00) AS sellprice,
            0 AS stock
        FROM supplier_products sp
        LEFT JOIN suppliers s ON sp.supplier_id = s.supplier_id
        LEFT JOIN product_categories pc ON sp.category_id = pc.category_id
        WHERE sp.is_active = 1
          AND s.is_active = 1
          AND (p_is_all = 1 OR p_supplier_id = 0 OR sp.supplier_id = p_supplier_id)
          AND (p_search = '' OR sp.product_name LIKE CONCAT('%', p_search, '%'))
          AND (
              p_category_ids = ''
              OR EXISTS (
                  SELECT 1
                  FROM supplier_product_categories spc
                  WHERE spc.supplier_product_id = sp.supplier_product_id
                    AND FIND_IN_SET(spc.category_id, p_category_ids) > 0
              )
              OR (
                  NOT EXISTS (
                      SELECT 1
                      FROM supplier_product_categories spc
                      WHERE spc.supplier_product_id = sp.supplier_product_id
                  )
                  AND FIND_IN_SET(sp.category_id, p_category_ids) > 0
              )
          )
        ORDER BY sp.supplier_product_id DESC;
    ELSE
        SELECT
            stp.store_product_id AS id,
            stp.store_product_id,
            sp.supplier_product_id,
            sp.supplier_id,
            COALESCE(s.supplier_name, 'Unknown Supplier') AS supplier_name,
            sp.category_id,
            COALESCE((SELECT GROUP_CONCAT(DISTINCT pc2.category_name ORDER BY pc2.category_name SEPARATOR ', ') FROM supplier_product_categories spc JOIN product_categories pc2 ON pc2.category_id = spc.category_id WHERE spc.supplier_product_id = sp.supplier_product_id), pc.category_name, 'General') AS category,
            COALESCE((SELECT GROUP_CONCAT(DISTINCT pc2.category_name ORDER BY pc2.category_name SEPARATOR ', ') FROM supplier_product_categories spc JOIN product_categories pc2 ON pc2.category_id = spc.category_id WHERE spc.supplier_product_id = sp.supplier_product_id), pc.category_name, 'General') AS category_name,
            COALESCE((SELECT GROUP_CONCAT(spc.category_id ORDER BY spc.category_id SEPARATOR ',') FROM supplier_product_categories spc WHERE spc.supplier_product_id = sp.supplier_product_id), CAST(sp.category_id AS CHAR)) AS category_ids,
            sp.product_name AS name,
            sp.product_name AS prodname,
            sp.product_name,
            sp.description,
            sp.image_path,
            COALESCE(stp.selling_price, sp.wholesale_price, 0.00) AS price,
            COALESCE(sp.wholesale_price, 0.00) AS wholesale_price,
            COALESCE(stp.selling_price, sp.wholesale_price, 0.00) AS selling_price,
            COALESCE(stp.selling_price, sp.wholesale_price, 0.00) AS sellprice,
            COALESCE((
                SELECT SUM(pb.quantity_in_stock)
                FROM product_batches pb
                WHERE pb.store_product_id = stp.store_product_id
                  AND pb.expiration_date >= CURDATE()
            ), 0) AS stock
        FROM store_products stp
        JOIN supplier_products sp ON stp.supplier_product_id = sp.supplier_product_id
        LEFT JOIN suppliers s ON sp.supplier_id = s.supplier_id
        LEFT JOIN product_categories pc ON sp.category_id = pc.category_id
        WHERE stp.is_active = 1
          AND sp.is_active = 1
          AND (p_search = '' OR sp.product_name LIKE CONCAT('%', p_search, '%'))
          AND (
              p_category_ids = ''
              OR EXISTS (
                  SELECT 1
                  FROM supplier_product_categories spc
                  WHERE spc.supplier_product_id = sp.supplier_product_id
                    AND FIND_IN_SET(spc.category_id, p_category_ids) > 0
              )
              OR (
                  NOT EXISTS (
                      SELECT 1
                      FROM supplier_product_categories spc
                      WHERE spc.supplier_product_id = sp.supplier_product_id
                  )
                  AND FIND_IN_SET(sp.category_id, p_category_ids) > 0
              )
          )
        ORDER BY stp.store_product_id DESC;
    END IF;
END$$
DELIMITER ;