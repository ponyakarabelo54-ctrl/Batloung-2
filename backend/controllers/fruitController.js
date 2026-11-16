const fruitModel = require('../models/fruitModel');
const stockModel = require('../models/stockModel');
const AppError = require('../utils/AppError');
const { withTransaction } = require('../config/db');
const { FRUIT_STATUSES } = require('../config/constants');
const { cleanText, cleanEnum } = require('../utils/validators');

function readFruitBody(body) {
  return {
    fruit_name: cleanText(body.fruit_name, 'fruit_name', { maxLength: 50 }),
    description: cleanText(body.description, 'description', { required: false }),
    status: body.status === undefined ? 'AVAILABLE' : cleanEnum(body.status, FRUIT_STATUSES, 'status'),
  };
}

async function getFruits(req, res, next) {
  try {
    const status = req.query.status ? cleanEnum(req.query.status, FRUIT_STATUSES, 'status') : undefined;
    res.status(200).json({ success: true, data: await fruitModel.getAll(status) });
  } catch (error) { next(error); }
}

async function getFruit(req, res, next) {
  try {
    const fruit = await fruitModel.getById(req.params.id);
    if (!fruit) throw new AppError(404, 'Fruit not found');
    res.status(200).json({ success: true, data: fruit });
  } catch (error) { next(error); }
}

// Creates the fruit AND its three stock rows (small, medium, large) together.
async function createFruit(req, res, next) {
  try {
    const data = readFruitBody(req.body);
    const id = await withTransaction(async (connection) => {
      const fruitId = await fruitModel.create(connection, data);
      await stockModel.createRowsForFruit(connection, fruitId);
      return fruitId;
    });
    res.status(201).json({ success: true, message: 'Fruit added', data: await fruitModel.getById(id) });
  } catch (error) { next(error); }
}

async function updateFruit(req, res, next) {
  try {
    const existing = await fruitModel.getById(req.params.id);
    if (!existing) throw new AppError(404, 'Fruit not found');
    const data = readFruitBody({ ...existing, ...req.body });
    await fruitModel.update(req.params.id, data);
    res.status(200).json({ success: true, message: 'Fruit updated', data: await fruitModel.getById(req.params.id) });
  } catch (error) { next(error); }
}

async function changeFruitStatus(req, res, next) {
  try {
    const status = cleanEnum(req.body.status, FRUIT_STATUSES, 'status');
    if (!(await fruitModel.getById(req.params.id))) throw new AppError(404, 'Fruit not found');
    await fruitModel.updateStatus(req.params.id, status);
    res.status(200).json({ success: true, message: `Fruit marked ${status}`, data: await fruitModel.getById(req.params.id) });
  } catch (error) { next(error); }
}

module.exports = { getFruits, getFruit, createFruit, updateFruit, changeFruitStatus };
