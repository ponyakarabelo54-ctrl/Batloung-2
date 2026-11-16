-- =====================================================================
-- REPORTING QUERIES (the same SQL the backend runs in reportModel.js)
-- Run in MySQL Workbench after importing batloung_farm.sql
-- =====================================================================
USE batloung_farm_db;

-- 1. Five most frequently sold fruits (by number of boxes sold)
SELECT f.fruit_id, f.fruit_name,
       SUM(sd.quantity)                  AS boxes_sold,
       SUM(sd.quantity * sd.unit_price)  AS revenue
FROM sales_details sd
JOIN fruits f ON f.fruit_id = sd.fruit_id
GROUP BY f.fruit_id, f.fruit_name
ORDER BY boxes_sold DESC
LIMIT 5;

-- 2. Total sales revenue between two dates (change the dates as needed)
SELECT COUNT(*)                          AS number_of_sales,
       COALESCE(SUM(total_amount), 0)    AS total_revenue,
       COALESCE(SUM(amount_paid), 0)     AS cash_collected
FROM sales
WHERE DATE(sale_date) BETWEEN '2026-09-01' AND '2026-10-31';

-- 3. Vendor who has purchased the highest number of boxes
SELECT v.vendor_id, v.vendor_name, SUM(sd.quantity) AS total_boxes
FROM vendors v
JOIN sales s          ON s.vendor_id = v.vendor_id
JOIN sales_details sd ON sd.sale_id  = s.sale_id
GROUP BY v.vendor_id, v.vendor_name
ORDER BY total_boxes DESC
LIMIT 1;

-- 4. Current stock levels for each fruit and packaging size
SELECT f.fruit_name, st.packaging_size, st.available_quantity
FROM stock st
JOIN fruits f ON f.fruit_id = st.fruit_id
ORDER BY f.fruit_name, FIELD(st.packaging_size, 'SMALL', 'MEDIUM', 'LARGE');

-- 5. Outstanding balance per vendor (money still owed)
SELECT v.vendor_id, v.vendor_name,
       SUM(s.total_amount)                    AS total_billed,
       SUM(s.amount_paid)                     AS total_paid,
       SUM(s.total_amount - s.amount_paid)    AS outstanding_balance
FROM vendors v
JOIN sales s ON s.vendor_id = v.vendor_id
GROUP BY v.vendor_id, v.vendor_name
HAVING outstanding_balance > 0
ORDER BY outstanding_balance DESC;

-- 6. Low-stock items (20 boxes or fewer)
SELECT f.fruit_name, st.packaging_size, st.available_quantity
FROM stock st
JOIN fruits f ON f.fruit_id = st.fruit_id
WHERE st.available_quantity <= 20
ORDER BY st.available_quantity;
