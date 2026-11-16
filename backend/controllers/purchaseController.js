const purchaseModel = require('../models/purchaseModel');
const supplierModel = require('../models/supplierModel');
const fruitModel = require('../models/fruitModel');
const stockModel = require('../models/stockModel');
const AppError = require('../utils/AppError');
const { withTransaction } = require('../config/db');
const { toCents, fromCents } = require('../utils/money');
const { cleanId } = require('../utils/validators');
const { cleanItems } = require('../utils/lineItems');

async function getPurchases(req, res, next) {
  try {
    res.status(200).json({ success: true, data: await purchaseModel.getAll() });
  } catch (error) { next(error); }
}

async function getPurchase(req, res, next) {
  try {
    const purchase = await purchaseModel.getById(req.params.id);
    if (!purchase) throw new AppError(404, 'Purchase not found');
    res.status(200).json({ success: true, data: purchase });
  } catch (error) { next(error); }
}

// POST /api/purchases
// { "supplier_id": 1, "items": [ { "fruit_id": 1, "packaging_size": "LARGE", "quantity": 10, "unit_cost": 150 } ] }
async function createPurchase(req, res, next) {
  try {
    const supplierId = cleanId(req.body.supplier_id, 'supplier_id');
    const items = cleanItems(req.body.items, 'unit_cost');

    if (!(await supplierModel.getById(supplierId))) throw new AppError(404, 'Supplier not found');
    for (const item of items) {
      const fruit = await fruitModel.getById(item.fruit_id);
      if (!fruit) throw new AppError(404, `Fruit with id ${item.fruit_id} not found`);
    }

    // Total is calculated automatically from the items.
    const totalAmount = fromCents(items.reduce((sum, i) => sum + i.quantity * toCents(i.unit_cost), 0));

    // Header + details + stock increase happen together, or not at all.
    const purchaseId = await withTransaction(async (connection) => {
      const newId = await purchaseModel.createHeader(connection, supplierId, totalAmount);
      for (const item of items) {
        await purchaseModel.createDetail(connection, newId, item);
        await stockModel.increase(connection, item.fruit_id, item.packaging_size, item.quantity);
      }
      return newId;
    });

    res.status(201).json({
      success: true,
      message: 'Purchase recorded and stock updated',
      data: await purchaseModel.getById(purchaseId),
    });
  } catch (error) { next(error); }
}

module.exports = { getPurchases, getPurchase, createPurchase };
