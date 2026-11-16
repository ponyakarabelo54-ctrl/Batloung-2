// SQL queries for sales and sales_details.
const { pool } = require('../config/db');

async function getAll({ vendorId } = {}) {
  const where = vendorId ? 'WHERE s.vendor_id = ?' : '';
  const [rows] = await pool.query(
    `SELECT s.sale_id, s.vendor_id, v.vendor_name, s.sale_date, s.payment_method,
            s.payment_status, s.total_amount, s.amount_paid,
            (s.total_amount - s.amount_paid) AS balance,
            (SELECT COALESCE(SUM(sd.quantity), 0) FROM sales_details sd
             WHERE sd.sale_id = s.sale_id) AS total_boxes
     FROM sales s
     JOIN vendors v ON v.vendor_id = s.vendor_id
     ${where}
     ORDER BY s.sale_date DESC, s.sale_id DESC`, vendorId ? [vendorId] : []);
  return rows;
}

async function getById(id, db = pool) {
  const [sales] = await db.query(
    `SELECT s.sale_id, s.vendor_id, v.vendor_name, v.phone_number, s.sale_date,
            s.payment_method, s.payment_status, s.total_amount, s.amount_paid,
            (s.total_amount - s.amount_paid) AS balance
     FROM sales s JOIN vendors v ON v.vendor_id = s.vendor_id
     WHERE s.sale_id = ?`, [id]);
  if (sales.length === 0) return undefined;
  const [items] = await db.query(
    `SELECT sd.sales_detail_id, sd.fruit_id, f.fruit_name, sd.packaging_size,
            sd.quantity, sd.unit_price, (sd.quantity * sd.unit_price) AS line_total
     FROM sales_details sd JOIN fruits f ON f.fruit_id = sd.fruit_id
     WHERE sd.sale_id = ?
     ORDER BY sd.sales_detail_id`, [id]);
  return { ...sales[0], items };
}

async function createHeader(db, sale) {
  const [result] = await db.query(
    `INSERT INTO sales (vendor_id, sale_date, payment_status, payment_method, total_amount, amount_paid)
     VALUES (?, NOW(), ?, ?, ?, ?)`,
    [sale.vendor_id, sale.payment_status, sale.payment_method, sale.total_amount, sale.amount_paid]);
  return result.insertId;
}

async function createDetail(db, saleId, item) {
  await db.query(
    `INSERT INTO sales_details (sale_id, fruit_id, packaging_size, quantity, unit_price)
     VALUES (?, ?, ?, ?, ?)`,
    [saleId, item.fruit_id, item.packaging_size, item.quantity, item.unit_price]);
}

// Locks a sale row so two payments can not be applied at the same moment.
async function lockById(db, id) {
  const [rows] = await db.query('SELECT * FROM sales WHERE sale_id = ? FOR UPDATE', [id]);
  return rows[0];
}

async function updatePayment(db, id, amountPaid, paymentStatus) {
  await db.query('UPDATE sales SET amount_paid = ?, payment_status = ? WHERE sale_id = ?',
    [amountPaid, paymentStatus, id]);
}

module.exports = { getAll, getById, createHeader, createDetail, lockById, updatePayment };
