const stockModel = require('../models/stockModel');
const { PACKAGING_SIZES, LOW_STOCK_THRESHOLD } = require('../config/constants');
const { cleanId, cleanEnum } = require('../utils/validators');
const AppError = require('../utils/AppError');
const fruitModel = require('../models/fruitModel');

// GET /api/stock?fruit_id=1&packaging_size=LARGE  (both filters optional)
async function getStock(req, res, next) {
  try {
    const filters = {};
    if (req.query.fruit_id) filters.fruitId = cleanId(req.query.fruit_id, 'fruit_id');
    if (req.query.packaging_size) filters.packagingSize = cleanEnum(req.query.packaging_size, PACKAGING_SIZES, 'packaging_size');
    res.status(200).json({ success: true, data: await stockModel.getAll(filters) });
  } catch (error) { next(error); }
}

// GET /api/stock/fruit/:id -> small, medium and large stock for one fruit
async function getStockForFruit(req, res, next) {
  try {
    if (!(await fruitModel.getById(req.params.id))) throw new AppError(404, 'Fruit not found');
    res.status(200).json({ success: true, data: await stockModel.getAll({ fruitId: req.params.id }) });
  } catch (error) { next(error); }
}

// GET /api/stock/low?threshold=20
async function getLowStock(req, res, next) {
  try {
    let threshold = LOW_STOCK_THRESHOLD;
    if (req.query.threshold !== undefined) {
      threshold = Number(req.query.threshold);
      if (!Number.isInteger(threshold) || threshold < 0) throw new AppError(400, 'threshold must be a whole number 0 or more');
    }
    const items = await stockModel.getLowStock(threshold);
    res.status(200).json({ success: true, threshold, data: items });
  } catch (error) { next(error); }
}

module.exports = { getStock, getStockForFruit, getLowStock };
