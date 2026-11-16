// Entry point of the Batloung Farm API.
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testConnection, pool } = require('./config/db');
const requestLogger = require('./middleware/requestLogger');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Allowed website addresses (from .env). "localhost" and "127.0.0.1" are both
// accepted because they are the same computer.
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .flatMap((origin) => [origin, origin.replace('localhost', '127.0.0.1'), origin.replace('127.0.0.1', 'localhost')]);
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(requestLogger);

// Health check (also reports whether MySQL is reachable)
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ success: true, message: 'API and database are running' });
  } catch (error) {
    res.status(503).json({ success: false, message: 'API is running but the database is not available' });
  }
});

app.use('/api/suppliers', require('./routes/supplierRoutes'));
app.use('/api/fruits', require('./routes/fruitRoutes'));
app.use('/api/vendors', require('./routes/vendorRoutes'));
app.use('/api/purchases', require('./routes/purchaseRoutes'));
app.use('/api/sales', require('./routes/saleRoutes'));
app.use('/api/stock', require('./routes/stockRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

app.use(notFound);
app.use(errorHandler);

// Safety nets: log the problem instead of letting the server crash.
process.on('unhandledRejection', (reason) => console.error('Unhandled promise rejection:', reason));
process.on('uncaughtException', (error) => console.error('Uncaught exception:', error));

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Batloung Farm API running on http://localhost:${PORT}`);
  await testConnection();
});
