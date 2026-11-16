-- =====================================================================
-- TRANSACTION DEMO: a multi-item sale where ONE item fails validation.
-- Run each block in MySQL Workbench and compare stock before / after.
-- =====================================================================
USE batloung_farm_db;

-- Stock BEFORE (Apples LARGE has only 10 boxes; Bananas SMALL has plenty)
SELECT fruit_id, packaging_size, available_quantity FROM stock
WHERE (fruit_id = 1 AND packaging_size = 'LARGE')
   OR (fruit_id = 2 AND packaging_size = 'SMALL');

-- ---------- Scenario A: FAILS -> ROLLBACK ----------------------------
-- The vendor asks for 5 small banana boxes (fine) and 15 large apple
-- boxes (only 10 available). The whole sale must be undone.
BEGIN;

INSERT INTO sales (vendor_id, payment_method, payment_status, total_amount, amount_paid)
VALUES (1, 'CASH', 'PAID', 0, 0);
SET @sale_id = LAST_INSERT_ID();

-- Item 1 succeeds
UPDATE stock SET available_quantity = available_quantity - 5
WHERE fruit_id = 2 AND packaging_size = 'SMALL' AND available_quantity >= 5;
SELECT ROW_COUNT() AS item1_rows_updated;          -- 1 = ok

-- Item 2 fails: the CHECK constraint / guard stops negative stock
UPDATE stock SET available_quantity = available_quantity - 15
WHERE fruit_id = 1 AND packaging_size = 'LARGE' AND available_quantity >= 15;
SELECT ROW_COUNT() AS item2_rows_updated;          -- 0 = NOT enough stock

-- Because item 2 failed we undo EVERYTHING (including item 1 and the sale)
ROLLBACK;

SELECT fruit_id, packaging_size, available_quantity FROM stock
WHERE (fruit_id = 1 AND packaging_size = 'LARGE')
   OR (fruit_id = 2 AND packaging_size = 'SMALL');  -- unchanged

-- ---------- Scenario B: SUCCEEDS -> COMMIT ---------------------------
BEGIN;

INSERT INTO sales (vendor_id, payment_method, payment_status, total_amount, amount_paid)
VALUES (1, 'CASH', 'PAID', 820.00, 820.00);
SET @sale_id = LAST_INSERT_ID();

INSERT INTO sales_details (sale_id, fruit_id, packaging_size, quantity, unit_price)
VALUES (@sale_id, 2, 'SMALL', 5, 120.00),     -- 600
       (@sale_id, 1, 'LARGE', 1, 220.00);     -- 220  (total 820)

UPDATE stock SET available_quantity = available_quantity - 5
WHERE fruit_id = 2 AND packaging_size = 'SMALL' AND available_quantity >= 5;
UPDATE stock SET available_quantity = available_quantity - 1
WHERE fruit_id = 1 AND packaging_size = 'LARGE' AND available_quantity >= 1;

COMMIT;
