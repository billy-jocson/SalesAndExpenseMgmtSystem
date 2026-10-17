DROP PROCEDURE IF EXISTS `sp_roles_delete`;
DELIMITER $$
CREATE PROCEDURE `sp_roles_delete` (IN `p_role_id` INT)
BEGIN
    DECLARE v_role_name VARCHAR(50);
    DECLARE v_count INT DEFAULT 0;

    SELECT role_name INTO v_role_name
    FROM roles
    WHERE role_id = p_role_id
    LIMIT 1;

    IF v_role_name IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Role not found.';
    END IF;

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
DELIMITER ;