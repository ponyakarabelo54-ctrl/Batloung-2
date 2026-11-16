// SQL queries for the stock table (one row per fruit + packaging size).
const { pool } = require('../config/db');

async function getAll({ fruitId, packagingSize } = {}) {
  const conditions = [];
  const values = [];
  if (fruitId) { conditions.push('st.fruit_id = ?'); values.push(fruitId); }
  if (packagingSize) { conditions.push('st.packaging_size = ?'); values.push(packagingSize); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT st.stock_id, st.fruit_id, f.fruit_name, f.status AS fruit_status,
            st.packaging_size, st.available_quantity
     FROM stock st
     JOIN fruits f ON f.fruit_id = st.fruit_id
     ${where}
     ORDER BY f.fruit_name, FIELD(st.packaging_size, 'SMALL', 'MEDIUM', 'LARGE')`, values);
  return rows;
}

async function getLowStock(threshold) {
  const [rows] = await pool.query(
    `SELECT st.stock_id, st.fruit_id, f.fruit_name, st.packaging_size, st.available_quantity
     FROM stock st
     JOIN fruits f ON f.fruit_id = st.fruit_id
     WHERE st.available_quantity <= ?
     ORDER BY st.available_quantity, f.fruit_name`, [threshold]);
  return rows;
}

// Add boxes to stock (used by purchases). Creates the row if it is missing.
async function increase(db, fruitId, packagingSize, quantity) {
  const [result] = await db.query(
    `UPDATE stock SET available_quantity = available_quantity + ?
     WHERE fruit_id = ? AND packaging_size = ?`, [quantity, fruitId, packagingSize]);
  if (result.affectedRows === 0) {
    await db.query(
      'INSERT INTO stock (fruit_id, packaging_size, available_quantity) VALUES (?, ?, ?)',
      [fruitId, packagingSize, quantity]);
  }
}

// Locks the stock row and returns its quantity (0 if there is no row).
async function lockQuantity(db, fruitId, packagingSize) {
  const [rows] = await db.query(
    `SELECT available_quantity FROM stock
     WHERE fruit_id = ? AND packaging_size = ? FOR UPDATE`, [fruitId, packagingSize]);
  return rows.length ? rows[0].available_quantity : 0;
}

// Remove boxes from stock (used by sales). The "available_quantity >= ?" guard
// means stock can never go negative; returns false if there was not enough.
async function decrease(db, fruitId, packagingSize, quantity) {
  const [result] = await db.query(
    `UPDATE stock SET available_quantity = available_quantity - ?
     WHERE fruit_id = ? AND packaging_size = ? AND available_quantity >= ?`,
    [quantity, fruitId, packagingSize, quantity]);
  return result.affectedRows === 1;
}

// Creates SMALL / MEDIUM / LARGE rows (0 boxes) for a new fruit.
async function createRowsForFruit(db, fruitId) {
  await db.query(
    `INSERT INTO stock (fruit_id, packaging_size, available_quantity)
     VALUES (?, 'SMALL', 0), (?, 'MEDIUM', 0), (?, 'LARGE', 0)`, [fruitId, fruitId, fruitId]);
}

module.exports = { getAll, getLowStock, increase, lockQuantity, decrease, createRowsForFruit };
