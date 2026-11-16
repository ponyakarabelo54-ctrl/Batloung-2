// SQL for the reports and the dashboard summary.
const { pool } = require('../config/db');

// 1. Five most frequently sold fruits (by boxes sold)
async function topSoldFruits() {
  const [rows] = await pool.query(
    `SELECT f.fruit_id, f.fruit_name,
            SUM(sd.quantity) AS boxes_sold,
            SUM(sd.quantity * sd.unit_price) AS revenue
     FROM sales_details sd
     JOIN fruits f ON f.fruit_id = sd.fruit_id
     GROUP BY f.fruit_id, f.fruit_name
     ORDER BY boxes_sold DESC, f.fruit_name
     LIMIT 5`);
  return rows;
}

// 2. Total sales revenue in a date range (both dates included)
async function revenueBetween(fromDate, toDate) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS number_of_sales,
            COALESCE(SUM(total_amount), 0) AS total_revenue,
            COALESCE(SUM(amount_paid), 0) AS amount_collected,
            COALESCE(SUM(total_amount - amount_paid), 0) AS amount_outstanding
     FROM sales
     WHERE sale_date >= ? AND sale_date < DATE_ADD(?, INTERVAL 1 DAY)`, [fromDate, toDate]);
  return rows[0];
}

// 3. Vendors ranked by number of boxes bought (first row = highest)
async function vendorsByBoxes() {
  const [rows] = await pool.query(
    `SELECT v.vendor_id, v.vendor_name, v.location, SUM(sd.quantity) AS total_boxes
     FROM vendors v
     JOIN sales s ON s.vendor_id = v.vendor_id
     JOIN sales_details sd ON sd.sale_id = s.sale_id
     GROUP BY v.vendor_id, v.vendor_name, v.location
     ORDER BY total_boxes DESC, v.vendor_name
     LIMIT 5`);
  return rows;
}

// 5. Outstanding balance per vendor
async function outstandingBalances() {
  const [rows] = await pool.query(
    `SELECT v.vendor_id, v.vendor_name, v.phone_number,
            COUNT(s.sale_id) AS unpaid_sales,
            SUM(s.total_amount) AS total_billed,
            SUM(s.amount_paid) AS total_paid,
            SUM(s.total_amount - s.amount_paid) AS outstanding_balance
     FROM vendors v
     JOIN sales s ON s.vendor_id = v.vendor_id AND s.amount_paid < s.total_amount
     GROUP BY v.vendor_id, v.vendor_name, v.phone_number
     ORDER BY outstanding_balance DESC`);
  return rows;
}

async function dashboardTotals() {
  const [[counts]] = await pool.query(
    `SELECT (SELECT COUNT(*) FROM suppliers) AS total_suppliers,
            (SELECT COUNT(*) FROM vendors)   AS total_vendors,
            (SELECT COUNT(*) FROM fruits)    AS total_fruits,
            (SELECT COUNT(*) FROM sales)     AS total_sales_count,
            (SELECT COALESCE(SUM(total_amount), 0) FROM sales) AS total_sales_amount,
            (SELECT COUNT(*) FROM purchases) AS total_purchases_count,
            (SELECT COALESCE(SUM(total_amount), 0) FROM purchases) AS total_purchases_amount,
            (SELECT COALESCE(SUM(available_quantity), 0) FROM stock) AS available_stock,
            (SELECT COALESCE(SUM(total_amount - amount_paid), 0) FROM sales) AS total_outstanding`);
  return counts;
}

async function recentSales(limit) {
  const [rows] = await pool.query(
    `SELECT s.sale_id, v.vendor_name, s.sale_date, s.total_amount, s.payment_status
     FROM sales s JOIN vendors v ON v.vendor_id = s.vendor_id
     ORDER BY s.sale_date DESC, s.sale_id DESC LIMIT ?`, [limit]);
  return rows;
}

module.exports = {
  topSoldFruits, revenueBetween, vendorsByBoxes, outstandingBalances, dashboardTotals, recentSales,
};
