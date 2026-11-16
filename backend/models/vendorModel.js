// SQL queries for the vendors table.
const { pool } = require('../config/db');

// Every vendor row also shows how much the vendor still owes.
const VENDOR_SELECT = `
  SELECT v.vendor_id, v.vendor_name, v.phone_number, v.location, v.registration_date,
         COALESCE((SELECT SUM(s.total_amount - s.amount_paid) FROM sales s
                   WHERE s.vendor_id = v.vendor_id), 0) AS outstanding_balance
  FROM vendors v`;

async function getAll(search) {
  if (search) {
    const like = `%${search}%`;
    const [rows] = await pool.query(
      `${VENDOR_SELECT}
       WHERE v.vendor_name LIKE ? OR v.phone_number LIKE ?
       ORDER BY v.vendor_name`, [like, like]);
    return rows;
  }
  const [rows] = await pool.query(`${VENDOR_SELECT} ORDER BY v.vendor_name`);
  return rows;
}

async function getById(id, db = pool) {
  const [rows] = await db.query(`${VENDOR_SELECT} WHERE v.vendor_id = ?`, [id]);
  return rows[0];
}

async function create(v) {
  const [result] = await pool.query(
    `INSERT INTO vendors (vendor_name, phone_number, location, registration_date)
     VALUES (?, ?, ?, COALESCE(?, CURRENT_DATE))`,
    [v.vendor_name, v.phone_number, v.location, v.registration_date]);
  return result.insertId;
}

async function update(id, v) {
  const [result] = await pool.query(
    `UPDATE vendors SET vendor_name = ?, phone_number = ?, location = ?,
            registration_date = COALESCE(?, registration_date)
     WHERE vendor_id = ?`,
    [v.vendor_name, v.phone_number, v.location, v.registration_date, id]);
  return result.affectedRows;
}

module.exports = { getAll, getById, create, update };
