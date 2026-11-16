// SQL queries for purchases and purchase_details.
const { pool } = require('../config/db');

async function getAll() {
  const [rows] = await pool.query(
    `SELECT p.purchase_id, p.supplier_id, s.business_name AS supplier_name, s.province,
            p.purchase_date, p.total_amount,
            (SELECT COALESCE(SUM(pd.quantity), 0) FROM purchase_details pd
             WHERE pd.purchase_id = p.purchase_id) AS total_boxes
     FROM purchases p
     JOIN suppliers s ON s.supplier_id = p.supplier_id
     ORDER BY p.purchase_date DESC, p.purchase_id DESC`);
  return rows;
}

async function getById(id) {
  const [purchases] = await pool.query(
    `SELECT p.purchase_id, p.supplier_id, s.business_name AS supplier_name, s.province,
            p.purchase_date, p.total_amount
     FROM purchases p JOIN suppliers s ON s.supplier_id = p.supplier_id
     WHERE p.purchase_id = ?`, [id]);
  if (purchases.length === 0) return undefined;
  const [items] = await pool.query(
    `SELECT pd.purchase_detail_id, pd.fruit_id, f.fruit_name, pd.packaging_size,
            pd.quantity, pd.unit_cost, (pd.quantity * pd.unit_cost) AS line_total
     FROM purchase_details pd JOIN fruits f ON f.fruit_id = pd.fruit_id
     WHERE pd.purchase_id = ?
     ORDER BY pd.purchase_detail_id`, [id]);
  return { ...purchases[0], items };
}

async function createHeader(db, supplierId, totalAmount) {
  const [result] = await db.query(
    'INSERT INTO purchases (supplier_id, purchase_date, total_amount) VALUES (?, NOW(), ?)',
    [supplierId, totalAmount]);
  return result.insertId;
}

async function createDetail(db, purchaseId, item) {
  await db.query(
    `INSERT INTO purchase_details (purchase_id, fruit_id, quantity, unit_cost, packaging_size)
     VALUES (?, ?, ?, ?, ?)`,
    [purchaseId, item.fruit_id, item.quantity, item.unit_cost, item.packaging_size]);
}

module.exports = { getAll, getById, createHeader, createDetail };
