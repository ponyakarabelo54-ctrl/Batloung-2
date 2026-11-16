const reportModel = require('../models/reportModel');
const stockModel = require('../models/stockModel');
const AppError = require('../utils/AppError');
const { LOW_STOCK_THRESHOLD } = require('../config/constants');
const { cleanDateOnly } = require('../utils/validators');

async function topFruits(req, res, next) {
  try {
    res.status(200).json({ success: true, data: await reportModel.topSoldFruits() });
  } catch (error) { next(error); }
}

// GET /api/reports/revenue?from=2026-09-01&to=2026-10-31
async function revenue(req, res, next) {
  try {
    const from = cleanDateOnly(req.query.from, 'from');
    const to = cleanDateOnly(req.query.to, 'to');
    if (from > to) throw new AppError(400, '"from" date can not be after "to" date');
    const data = await reportModel.revenueBetween(from, to);
    res.status(200).json({ success: true, data: { from, to, ...data } });
  } catch (error) { next(error); }
}

async function topVendor(req, res, next) {
  try {
    const ranking = await reportModel.vendorsByBoxes();
    res.status(200).json({ success: true, data: { top_vendor: ranking[0] || null, ranking } });
  } catch (error) { next(error); }
}

async function currentStock(req, res, next) {
  try {
    res.status(200).json({ success: true, data: await stockModel.getAll() });
  } catch (error) { next(error); }
}

async function outstandingBalances(req, res, next) {
  try {
    const data = await reportModel.outstandingBalances();
    const total = data.reduce((sum, row) => sum + Number(row.outstanding_balance), 0);
    res.status(200).json({ success: true, total_outstanding: Math.round(total * 100) / 100, data });
  } catch (error) { next(error); }
}

async function dashboard(req, res, next) {
  try {
    const [totals, lowStock, recentSales] = await Promise.all([
      reportModel.dashboardTotals(),
      stockModel.getLowStock(LOW_STOCK_THRESHOLD),
      reportModel.recentSales(5),
    ]);
    res.status(200).json({
      success: true,
      data: { ...totals, low_stock_threshold: LOW_STOCK_THRESHOLD, low_stock_items: lowStock, recent_sales: recentSales },
    });
  } catch (error) { next(error); }
}

module.exports = { topFruits, revenue, topVendor, currentStock, outstandingBalances, dashboard };
