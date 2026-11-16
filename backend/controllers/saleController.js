const saleModel = require('../models/saleModel');
const vendorModel = require('../models/vendorModel');
const fruitModel = require('../models/fruitModel');
const stockModel = require('../models/stockModel');
const AppError = require('../utils/AppError');
const { withTransaction } = require('../config/db');
const { PAYMENT_METHODS, DEFAULT_SELLING_PRICES } = require('../config/constants');
const { cleanId, cleanEnum, cleanPositiveMoney } = require('../utils/validators');
const { cleanItems } = require('../utils/lineItems');
const { calculateSaleTotal, determinePayment, applyLaterPayment } = require('../utils/salesCalculations');

async function getSales(req, res, next) {
  try {
    const vendorId = req.query.vendor_id ? cleanId(req.query.vendor_id, 'vendor_id') : undefined;
    res.status(200).json({ success: true, data: await saleModel.getAll({ vendorId }) });
  } catch (error) { next(error); }
}

async function getSale(req, res, next) {
  try {
    const sale = await saleModel.getById(req.params.id);
    if (!sale) throw new AppError(404, 'Sale not found');
    res.status(200).json({ success: true, data: sale });
  } catch (error) { next(error); }
}

// GET /api/sales/prices -> default selling price per packaging size
function getDefaultPrices(req, res) {
  res.status(200).json({ success: true, data: DEFAULT_SELLING_PRICES });
}

// POST /api/sales
// { "vendor_id": 1, "payment_method": "CASH",
//   "items": [ { "fruit_id": 1, "packaging_size": "LARGE", "quantity": 10 } ] }
// unit_price is optional (the default price for the packaging size is used).
// amount_paid is optional (CASH/MOBILE_MONEY = full, CREDIT = 0).
async function createSale(req, res, next) {
  try {
    const vendorId = cleanId(req.body.vendor_id, 'vendor_id');
    const paymentMethod = cleanEnum(req.body.payment_method, PAYMENT_METHODS, 'payment_method');
    const items = cleanItems(req.body.items, 'unit_price', DEFAULT_SELLING_PRICES);

    if (!(await vendorModel.getById(vendorId))) throw new AppError(404, 'Vendor not found');
    for (const item of items) {
      const fruit = await fruitModel.getById(item.fruit_id);
      if (!fruit) throw new AppError(404, `Fruit with id ${item.fruit_id} not found`);
      if (fruit.status !== 'AVAILABLE') throw new AppError(400, `${fruit.fruit_name} is currently unavailable and can not be sold`);
      item.fruit_name = fruit.fruit_name;
    }

    // Totals and payment status are calculated by the system, never typed in.
    const totalAmount = calculateSaleTotal(items);
    const payment = determinePayment(paymentMethod, totalAmount, req.body.amount_paid);

    // Everything below is ONE transaction. If any item has too little stock
    // we throw, ROLLBACK runs, and nothing at all is saved.
    const saleId = await withTransaction(async (connection) => {
      // Total boxes wanted per fruit + size (the same fruit/size may appear on
      // two lines with different prices).
      const wanted = new Map();
      for (const item of items) {
        const key = `${item.fruit_id}-${item.packaging_size}`;
        wanted.set(key, (wanted.get(key) || 0) + item.quantity);
      }

      // Lock rows in a fixed order (prevents deadlocks) and check ALL items
      // before changing anything, so the error lists every shortage.
      const keys = [...wanted.keys()].sort();
      const shortages = [];
      for (const key of keys) {
        const [fruitId, size] = key.split('-');
        const available = await stockModel.lockQuantity(connection, Number(fruitId), size);
        if (available < wanted.get(key)) {
          const name = items.find((i) => i.fruit_id === Number(fruitId)).fruit_name;
          shortages.push({ fruit_id: Number(fruitId), fruit_name: name, packaging_size: size, requested: wanted.get(key), available });
        }
      }
      if (shortages.length > 0) {
        const first = shortages[0];
        throw new AppError(400,
          `Insufficient stock: requested ${first.requested} ${first.packaging_size} box(es) of ${first.fruit_name} but only ${first.available} available. Sale was not recorded.`,
          { code: 'INSUFFICIENT_STOCK', shortages });
      }

      const newSaleId = await saleModel.createHeader(connection, {
        vendor_id: vendorId,
        payment_method: paymentMethod,
        total_amount: totalAmount,
        ...payment,
      });
      for (const item of items) {
        await saleModel.createDetail(connection, newSaleId, item);
        const ok = await stockModel.decrease(connection, item.fruit_id, item.packaging_size, item.quantity);
        if (!ok) throw new AppError(400, `Insufficient stock for ${item.fruit_name} (${item.packaging_size})`);
      }
      return newSaleId;
    });

    res.status(201).json({
      success: true,
      message: 'Sale recorded and stock updated',
      data: await saleModel.getById(saleId),
    });
  } catch (error) { next(error); }
}

// POST /api/sales/:id/payments  { "amount": 500 }
// A vendor pays off part (or all) of what they still owe on a sale.
async function addPayment(req, res, next) {
  try {
    const amount = cleanPositiveMoney(req.body.amount, 'amount');
    await withTransaction(async (connection) => {
      const sale = await saleModel.lockById(connection, req.params.id);
      if (!sale) throw new AppError(404, 'Sale not found');
      const updated = applyLaterPayment(sale, amount);
      await saleModel.updatePayment(connection, sale.sale_id, updated.amount_paid, updated.payment_status);
    });
    res.status(200).json({ success: true, message: 'Payment recorded', data: await saleModel.getById(req.params.id) });
  } catch (error) { next(error); }
}

module.exports = { getSales, getSale, getDefaultPrices, createSale, addPayment };
