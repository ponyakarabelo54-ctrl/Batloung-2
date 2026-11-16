// SQL queries for the suppliers table.
const { pool } = require('../config/db');

async function getAll(search) {
  if (search) {
    const like = `%${search}%`;
    const [rows] = await pool.query(
      `SELECT * FROM suppliers
       WHERE business_name LIKE ? OR contact_person LIKE ? OR phone LIKE ? OR province LIKE ?
       ORDER BY business_name`, [like, like, like, like]);
    return rows;
  }
  const [rows] = await pool.query('SELECT * FROM suppliers ORDER BY business_name');
  return rows;
}

async function getById(id) {
  const [rows] = await pool.query('SELECT * FROM suppliers WHERE supplier_id = ?', [id]);
  return rows[0];
}

async function create(s) {
  const [result] = await pool.query(
    `INSERT INTO suppliers (business_name, contact_person, phone, province, address)
     VALUES (?, ?, ?, ?, ?)`,
    [s.business_name, s.contact_person, s.phone, s.province, s.address]);
  return result.insertId;
}

async function update(id, s) {
  const [result] = await pool.query(
    `UPDATE suppliers SET business_name = ?, contact_person = ?, phone = ?, province = ?, address = ?
     WHERE supplier_id = ?`,
    [s.business_name, s.contact_person, s.phone, s.province, s.address, id]);
  return result.affectedRows;
}

async function countPurchases(id) {
  const [rows] = await pool.query('SELECT COUNT(*) AS total FROM purchases WHERE supplier_id = ?', [id]);
  return rows[0].total;
}

async function remove(id) {
  const [result] = await pool.query('DELETE FROM suppliers WHERE supplier_id = ?', [id]);
  return result.affectedRows;
}

module.exports = { getAll, getById, create, update, countPurchases, remove };
