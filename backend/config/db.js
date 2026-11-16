// MySQL connection pool + helpers.
// All credentials come from the .env file - nothing is hard-coded here.
require('dotenv').config();
const mysql = require('mysql2/promise');

const databaseName = process.env.DB_NAME || process.env.MYSQLDATABASE || 'batloung_farm_db';
const pool = mysql.createPool({
  host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
  port: Number(process.env.DB_PORT || process.env.MYSQLPORT) || 3306,
  user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
  database: databaseName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true, // return DECIMAL columns as numbers instead of strings
  dateStrings: true,    // return DATE/DATETIME as plain strings (no timezone shifts)
});

// Checks that MySQL is reachable. It never throws, so a database problem
// can not crash the server - it only logs a clear message.
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log(`MySQL connected: ${databaseName}`);
    return true;
  } catch (error) {
    console.error('--------------------------------------------------');
    console.error('Could not connect to MySQL:', error.code || error.message);
    console.error('Check that MySQL is running and that backend/.env or the Railway variables are correct.');
    console.error('The API will keep running and return 503 until MySQL is available.');
    console.error('--------------------------------------------------');
    return false;
  }
}

// Runs "work" inside a transaction using BEGIN / COMMIT / ROLLBACK.
// If work() throws an error, everything done inside it is undone.
async function withTransaction(work) {
  const connection = await pool.getConnection();
  try {
    await connection.query('BEGIN');
    const result = await work(connection);
    await connection.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await connection.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('ROLLBACK failed:', rollbackError.message);
    }
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { pool, testConnection, withTransaction };
