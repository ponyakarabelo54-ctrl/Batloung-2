// SQL queries for the fruits table.
const { pool } = require('../config/db');

async function getAll(status) {
  if (status) {
    const [rows] = await pool.query('SELECT * FROM fruits WHERE status = ? ORDER BY fruit_name', [status]);
    return rows;
  }
  const [rows] = await pool.query('SELECT * FROM fruits ORDER BY fruit_name');
  return rows;
}

async function getById(id, db = pool) {
  const [rows] = await db.query('SELECT * FROM fruits WHERE fruit_id = ?', [id]);
  return rows[0];
}

// Creates a fruit inside an existing transaction connection.
async function create(db, fruit) {
  const [result] = await db.query(
    'INSERT INTO fruits (fruit_name, description, status) VALUES (?, ?, ?)',
    [fruit.fruit_name, fruit.description, fruit.status]);
  return result.insertId;
}

async function update(id, fruit) {
  const [result] = await pool.query(
    'UPDATE fruits SET fruit_name = ?, description = ?, status = ? WHERE fruit_id = ?',
    [fruit.fruit_name, fruit.description, fruit.status, id]);
  return result.affectedRows;
}

async function updateStatus(id, status) {
  const [result] = await pool.query('UPDATE fruits SET status = ? WHERE fruit_id = ?', [status, id]);
  return result.affectedRows;
}

module.exports = { getAll, getById, create, update, updateStatus };
