-- =====================================================================
-- BATLOUNG FARM DISTRIBUTION MANAGEMENT SYSTEM
-- Database : batloung_farm_db   (MySQL 8.0)
-- Import   : MySQL Workbench -> Server -> Data Import -> Import from
--            Self-Contained File -> pick this file -> Start Import
--            (or just open it in a SQL tab and press the lightning bolt)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS batloung_farm_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE batloung_farm_db;

-- Drop old tables (children first) so the script can be re-run safely
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS stock;
DROP TABLE IF EXISTS sales_details;
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS purchase_details;
DROP TABLE IF EXISTS purchases;
DROP TABLE IF EXISTS vendors;
DROP TABLE IF EXISTS fruits;
DROP TABLE IF EXISTS suppliers;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- 1. SUPPLIERS - businesses in South Africa that sell fruit to us
-- ---------------------------------------------------------------------
CREATE TABLE suppliers (
  supplier_id    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  business_name  VARCHAR(100) NOT NULL,
  contact_person VARCHAR(100) NOT NULL,
  phone          VARCHAR(20)  NOT NULL,
  province       ENUM('Gauteng','Free State','KwaZulu-Natal','Western Cape',
                      'Eastern Cape','Limpopo','Mpumalanga','North West') NOT NULL,
  address        VARCHAR(255) NOT NULL,
  PRIMARY KEY (supplier_id),
  UNIQUE KEY uq_suppliers_phone (phone),
  CONSTRAINT chk_suppliers_name CHECK (CHAR_LENGTH(TRIM(business_name)) > 0),
  CONSTRAINT chk_suppliers_contact CHECK (CHAR_LENGTH(TRIM(contact_person)) > 0)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2. FRUITS - the types of fruit we distribute
-- ---------------------------------------------------------------------
CREATE TABLE fruits (
  fruit_id    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  fruit_name  VARCHAR(50)  NOT NULL,
  description VARCHAR(255) NULL,
  status      ENUM('AVAILABLE','UNAVAILABLE') NOT NULL DEFAULT 'AVAILABLE',
  PRIMARY KEY (fruit_id),
  UNIQUE KEY uq_fruits_name (fruit_name),
  CONSTRAINT chk_fruits_name CHECK (CHAR_LENGTH(TRIM(fruit_name)) > 0)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 3. VENDORS - street vendors and small retailers in Lesotho
-- ---------------------------------------------------------------------
CREATE TABLE vendors (
  vendor_id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  vendor_name       VARCHAR(100) NOT NULL,
  phone_number      VARCHAR(20)  NOT NULL,
  location          VARCHAR(150) NOT NULL,
  registration_date DATE         NOT NULL,
  PRIMARY KEY (vendor_id),
  UNIQUE KEY uq_vendors_phone (phone_number),
  CONSTRAINT chk_vendors_name CHECK (CHAR_LENGTH(TRIM(vendor_name)) > 0)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 4. PURCHASES - one row per purchase order placed with a supplier
-- ---------------------------------------------------------------------
CREATE TABLE purchases (
  purchase_id   INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  supplier_id   INT UNSIGNED  NOT NULL,
  purchase_date DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total_amount  DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (purchase_id),
  CONSTRAINT fk_purchases_supplier FOREIGN KEY (supplier_id)
    REFERENCES suppliers (supplier_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_purchases_total CHECK (total_amount >= 0)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 5. PURCHASE_DETAILS - the fruit lines inside a purchase (boxes)
-- ---------------------------------------------------------------------
CREATE TABLE purchase_details (
  purchase_detail_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  purchase_id        INT UNSIGNED NOT NULL,
  fruit_id           INT UNSIGNED NOT NULL,
  quantity           INT UNSIGNED NOT NULL,            -- number of boxes
  unit_cost          DECIMAL(10,2) NOT NULL,           -- cost per box
  packaging_size     ENUM('SMALL','MEDIUM','LARGE') NOT NULL,
  PRIMARY KEY (purchase_detail_id),
  CONSTRAINT fk_pd_purchase FOREIGN KEY (purchase_id)
    REFERENCES purchases (purchase_id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_pd_fruit FOREIGN KEY (fruit_id)
    REFERENCES fruits (fruit_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_pd_quantity CHECK (quantity > 0),
  CONSTRAINT chk_pd_unit_cost CHECK (unit_cost > 0)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 6. SALES - one row per sale to a vendor
-- ---------------------------------------------------------------------
CREATE TABLE sales (
  sale_id        INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  vendor_id      INT UNSIGNED  NOT NULL,
  sale_date      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  payment_status ENUM('PAID','PARTIALLY_PAID','UNPAID') NOT NULL DEFAULT 'UNPAID',
  payment_method ENUM('CASH','MOBILE_MONEY','CREDIT')   NOT NULL,
  total_amount   DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  amount_paid    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (sale_id),
  CONSTRAINT fk_sales_vendor FOREIGN KEY (vendor_id)
    REFERENCES vendors (vendor_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_sales_total CHECK (total_amount >= 0),
  CONSTRAINT chk_sales_paid CHECK (amount_paid >= 0 AND amount_paid <= total_amount)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 7. SALES_DETAILS - the fruit lines inside a sale (boxes)
-- ---------------------------------------------------------------------
CREATE TABLE sales_details (
  sales_detail_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  sale_id         INT UNSIGNED NOT NULL,
  fruit_id        INT UNSIGNED NOT NULL,
  packaging_size  ENUM('SMALL','MEDIUM','LARGE') NOT NULL,
  quantity        INT UNSIGNED NOT NULL,               -- number of boxes
  unit_price      DECIMAL(10,2) NOT NULL,              -- selling price per box
  PRIMARY KEY (sales_detail_id),
  CONSTRAINT fk_sd_sale FOREIGN KEY (sale_id)
    REFERENCES sales (sale_id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_sd_fruit FOREIGN KEY (fruit_id)
    REFERENCES fruits (fruit_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_sd_quantity CHECK (quantity > 0),
  CONSTRAINT chk_sd_unit_price CHECK (unit_price > 0)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 8. STOCK - ONE ROW PER FRUIT + PACKAGING SIZE (small/medium/large are
--    tracked separately). UNIQUE key stops duplicate rows and the CHECK
--    stops stock from ever going negative.
-- ---------------------------------------------------------------------
CREATE TABLE stock (
  stock_id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  fruit_id           INT UNSIGNED NOT NULL,
  packaging_size     ENUM('SMALL','MEDIUM','LARGE') NOT NULL,
  available_quantity INT NOT NULL DEFAULT 0,
  PRIMARY KEY (stock_id),
  UNIQUE KEY uq_stock_fruit_size (fruit_id, packaging_size),
  CONSTRAINT fk_stock_fruit FOREIGN KEY (fruit_id)
    REFERENCES fruits (fruit_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_stock_quantity CHECK (available_quantity >= 0)
) ENGINE=InnoDB;

-- =====================================================================
-- SAMPLE DATA
-- =====================================================================

-- Suppliers: one in each South African province named in the brief
INSERT INTO suppliers (business_name, contact_person, phone, province, address) VALUES
('Highveld Fresh Produce',     'Johan van der Merwe', '+27 11 555 0101', 'Gauteng',       '12 Market Road, City Deep, Johannesburg'),
('Free State Orchards',        'Palesa Mokoena',      '+27 51 555 0102', 'Free State',    '45 Orchard Lane, Bloemfontein'),
('Natal Tropical Fruits',      'Sipho Dlamini',       '+27 31 555 0103', 'KwaZulu-Natal', '8 Harbour Street, Durban'),
('Cape Vine & Fruit Co.',      'Annelie Botha',       '+27 21 555 0104', 'Western Cape',  '101 Vineyard Way, Paarl'),
('Eastern Cape Citrus',        'Thandi Nkosi',        '+27 41 555 0105', 'Eastern Cape',  '23 Citrus Drive, Gqeberha'),
('Limpopo Mango Growers',      'Rudzani Mulaudzi',    '+27 15 555 0106', 'Limpopo',       '7 Mango Close, Tzaneen'),
('Lowveld Fruit Traders',      'Nomsa Khumalo',       '+27 13 555 0107', 'Mpumalanga',    '56 Fruit Avenue, Nelspruit'),
('North West Farm Supplies',   'Kabelo Tau',          '+27 18 555 0108', 'North West',    '3 Farm Road, Potchefstroom');

-- Fruits: the five fruits the company distributes
INSERT INTO fruits (fruit_name, description, status) VALUES
('Apples',  'Crisp red and green apples',        'AVAILABLE'),
('Bananas', 'Sweet yellow bananas',              'AVAILABLE'),
('Oranges', 'Juicy citrus oranges',              'AVAILABLE'),
('Mangoes', 'Ripe tropical mangoes',             'AVAILABLE'),
('Grapes',  'Seedless table grapes',             'AVAILABLE');

-- Vendors: street vendors and small retailers in Lesotho
INSERT INTO vendors (vendor_name, phone_number, location, registration_date) VALUES
('Mamello Fruit Stand',     '+266 5801 0001', 'Maseru - Main Bus Rank',      '2026-01-15'),
('Lerato Fresh Corner',     '+266 5801 0002', 'Maseru - Maseru Mall Road',   '2026-02-03'),
('Thabo Street Vendor',     '+266 5801 0003', 'Maseru - Moshoeshoe Road',    '2026-02-20'),
('Nthabiseng Groceries',    '+266 5801 0004', 'Maseru - Qoaling',            '2026-03-08'),
('Tsepo Fruits & Veg',      '+266 5801 0005', 'Teyateyaneng - Town Centre',  '2026-04-12'),
('Palesa Market Stall',     '+266 5801 0006', 'Mafeteng - Market Square',    '2026-05-01'),
('Retselisitsoe Traders',   '+266 5801 0007', 'Maseru - Thetsane',           '2026-06-18'),
('Khotso Roadside Fruits',  '+266 5801 0008', 'Roma - Main Road',            '2026-07-22');

-- Purchases (total_amount is calculated from the details further below)
INSERT INTO purchases (supplier_id, purchase_date, total_amount) VALUES
(1, '2026-09-01 09:30:00', 0),
(2, '2026-09-10 10:15:00', 0),
(3, '2026-09-20 08:45:00', 0),
(4, '2026-10-02 11:00:00', 0),
(5, '2026-10-15 09:00:00', 0),
(6, '2026-11-02 14:20:00', 0);

-- Purchase details (quantity = boxes, unit_cost = cost per box in Maloti)
INSERT INTO purchase_details (purchase_id, fruit_id, quantity, unit_cost, packaging_size) VALUES
-- Purchase 1: Gauteng - Apples and Bananas
(1, 1, 100,  85.00, 'SMALL'), (1, 1,  80, 120.00, 'MEDIUM'), (1, 1,  60, 155.00, 'LARGE'),
(1, 2, 100,  70.00, 'SMALL'), (1, 2, 100, 100.00, 'MEDIUM'), (1, 2,  50, 130.00, 'LARGE'),
-- Purchase 2: Free State - Oranges and Mangoes
(2, 3, 120,  75.00, 'SMALL'), (2, 3, 100, 105.00, 'MEDIUM'), (2, 3,  80, 140.00, 'LARGE'),
(2, 4,  60,  95.00, 'SMALL'), (2, 4,  50, 135.00, 'MEDIUM'), (2, 4,  40, 175.00, 'LARGE'),
-- Purchase 3: KwaZulu-Natal - Mangoes
(3, 4,  50,  95.00, 'SMALL'), (3, 4,  40, 135.00, 'MEDIUM'), (3, 4,  30, 175.00, 'LARGE'),
-- Purchase 4: Western Cape - Grapes and Apples
(4, 5,  80, 110.00, 'SMALL'), (4, 5,  70, 150.00, 'MEDIUM'), (4, 5,  50, 195.00, 'LARGE'),
(4, 1,  60,  85.00, 'SMALL'), (4, 1,  50, 120.00, 'MEDIUM'), (4, 1,  40, 155.00, 'LARGE'),
-- Purchase 5: Eastern Cape - Oranges and Bananas
(5, 3,  50,  75.00, 'SMALL'), (5, 3,  40, 105.00, 'MEDIUM'), (5, 3,  30, 140.00, 'LARGE'),
(5, 2,  40,  70.00, 'SMALL'), (5, 2,  30, 100.00, 'MEDIUM'), (5, 2,  20, 130.00, 'LARGE'),
-- Purchase 6: Limpopo - Mangoes and Grapes
(6, 4,  40,  95.00, 'SMALL'), (6, 4,  30, 135.00, 'MEDIUM'), (6, 4,  20, 175.00, 'LARGE'),
(6, 5,  30, 110.00, 'SMALL'), (6, 5,  25, 150.00, 'MEDIUM'), (6, 5,  15, 195.00, 'LARGE');

-- Calculate each purchase total from its details
UPDATE purchases p
SET p.total_amount = (SELECT SUM(pd.quantity * pd.unit_cost)
                      FROM purchase_details pd
                      WHERE pd.purchase_id = p.purchase_id);

-- Sales (amount_paid is filled in after the totals are calculated)
-- Selling prices per box: SMALL = 120, MEDIUM = 170, LARGE = 220
INSERT INTO sales (vendor_id, sale_date, payment_status, payment_method, total_amount, amount_paid) VALUES
(1, '2026-09-05 10:00:00', 'PAID',           'CASH',         0, 0),
(2, '2026-09-12 11:30:00', 'PAID',           'MOBILE_MONEY', 0, 0),
(3, '2026-09-18 09:15:00', 'UNPAID',         'CREDIT',       0, 0),
(4, '2026-09-25 13:40:00', 'PARTIALLY_PAID', 'CASH',         0, 0),
(5, '2026-10-03 10:20:00', 'PARTIALLY_PAID', 'CREDIT',       0, 0),
(1, '2026-10-10 15:05:00', 'PAID',           'MOBILE_MONEY', 0, 0),
(6, '2026-10-20 09:50:00', 'UNPAID',         'CREDIT',       0, 0),
(2, '2026-10-28 12:10:00', 'PAID',           'CASH',         0, 0),
(7, '2026-11-05 10:35:00', 'PARTIALLY_PAID', 'CREDIT',       0, 0),
(8, '2026-11-10 14:00:00', 'PAID',           'MOBILE_MONEY', 0, 0);

INSERT INTO sales_details (sale_id, fruit_id, packaging_size, quantity, unit_price) VALUES
(1, 1, 'LARGE',  20, 220.00), (1, 2, 'SMALL',  30, 120.00),
(2, 1, 'MEDIUM', 25, 170.00), (2, 3, 'MEDIUM', 20, 170.00),
(3, 2, 'MEDIUM', 30, 170.00), (3, 2, 'LARGE',  15, 220.00),
(4, 3, 'LARGE',  25, 220.00), (4, 4, 'SMALL',  20, 120.00),
(5, 4, 'LARGE',  45, 220.00), (5, 4, 'MEDIUM', 25, 170.00),
(6, 5, 'SMALL',  30, 120.00), (6, 5, 'MEDIUM', 25, 170.00),
(7, 5, 'LARGE',  35, 220.00), (7, 1, 'LARGE',  40, 220.00),
(8, 1, 'SMALL',  40, 120.00), (8, 3, 'SMALL',  50, 120.00),
(9, 4, 'LARGE',  30, 220.00), (9, 5, 'LARGE',  20, 220.00),
(10, 1, 'LARGE', 30, 220.00), (10, 2, 'LARGE', 20, 220.00), (10, 3, 'MEDIUM', 30, 170.00);

-- Calculate each sale total, then amount paid from the payment status
UPDATE sales s
SET s.total_amount = (SELECT SUM(sd.quantity * sd.unit_price)
                      FROM sales_details sd
                      WHERE sd.sale_id = s.sale_id);

UPDATE sales
SET amount_paid = CASE payment_status
                    WHEN 'PAID'   THEN total_amount
                    WHEN 'UNPAID' THEN 0
                    ELSE ROUND(total_amount * 0.50, 2)
                  END;

-- Stock = everything purchased - everything sold, for every fruit and size.
-- A row is created for every fruit/size combination (15 rows) even if 0.
INSERT INTO stock (fruit_id, packaging_size, available_quantity)
SELECT f.fruit_id,
       sizes.packaging_size,
       COALESCE((SELECT SUM(pd.quantity) FROM purchase_details pd
                 WHERE pd.fruit_id = f.fruit_id AND pd.packaging_size = sizes.packaging_size), 0)
     - COALESCE((SELECT SUM(sd.quantity) FROM sales_details sd
                 WHERE sd.fruit_id = f.fruit_id AND sd.packaging_size = sizes.packaging_size), 0)
FROM fruits f
CROSS JOIN (SELECT 'SMALL' AS packaging_size
            UNION ALL SELECT 'MEDIUM'
            UNION ALL SELECT 'LARGE') AS sizes;
