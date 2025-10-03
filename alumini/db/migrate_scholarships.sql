-- Migration to update scholarships table
USE alumni_connect;

-- Check if columns exist and add them if they don't
SET @dbname = DATABASE();
SET @tablename = 'scholarships';

-- Add new columns if they don't exist
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'min_cgpa');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE scholarships ADD COLUMN min_cgpa DECIMAL(3,2) AFTER requirements', 
    'SELECT "Column min_cgpa already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'reservation_category');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE scholarships ADD COLUMN reservation_category VARCHAR(50) AFTER min_cgpa', 
    'SELECT "Column reservation_category already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'lateral_entry_allowed');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE scholarships ADD COLUMN lateral_entry_allowed BOOLEAN DEFAULT TRUE AFTER reservation_category', 
    'SELECT "Column lateral_entry_allowed already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'eligible_years');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE scholarships ADD COLUMN eligible_years TEXT AFTER lateral_entry_allowed', 
    'SELECT "Column eligible_years already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'eligible_majors');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE scholarships ADD COLUMN eligible_majors TEXT AFTER eligible_years', 
    'SELECT "Column eligible_majors already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'other_criteria');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE scholarships ADD COLUMN other_criteria TEXT AFTER eligible_majors', 
    'SELECT "Column other_criteria already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'updated_at');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE scholarships ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at', 
    'SELECT "Column updated_at already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add columns to users table
SET @tablename = 'users';

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'cgpa');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE users ADD COLUMN cgpa DECIMAL(3,2) AFTER skills', 
    'SELECT "Column cgpa already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'reservation_category');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE users ADD COLUMN reservation_category VARCHAR(50) AFTER cgpa', 
    'SELECT "Column reservation_category already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'is_lateral_entry');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE users ADD COLUMN is_lateral_entry BOOLEAN DEFAULT FALSE AFTER reservation_category', 
    'SELECT "Column is_lateral_entry already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add document_urls to applications table
SET @tablename = 'applications';

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'document_urls');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE applications ADD COLUMN document_urls TEXT AFTER resume_url', 
    'SELECT "Column document_urls already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Remove max_cgpa if it exists
SET @tablename = 'scholarships';
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'max_cgpa');
SET @sql = IF(@col_exists > 0, 
    'ALTER TABLE scholarships DROP COLUMN max_cgpa', 
    'SELECT "Column max_cgpa does not exist"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Migration completed successfully!' as status;
