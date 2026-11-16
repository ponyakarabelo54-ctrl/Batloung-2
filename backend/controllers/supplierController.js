const supplierModel = require('../models/supplierModel');
const AppError = require('../utils/AppError');
const { PROVINCES } = require('../config/constants');
const { cleanText, cleanPhone, cleanEnum } = require('../utils/validators');

// Checks the request body and returns a clean supplier object.
function readSupplierBody(body) {
  return {
    business_name: cleanText(body.business_name, 'business_name', { maxLength: 100 }),
    contact_person: cleanText(body.contact_person, 'contact_person', { maxLength: 100 }),
    phone: cleanPhone(body.phone, 'phone'),
    province: cleanEnum(body.province, PROVINCES, 'province'),
    address: cleanText(body.address, 'address'),
  };
}

async function getSuppliers(req, res, next) {
  try {
    const suppliers = await supplierModel.getAll(req.query.search ? String(req.query.search).trim() : '');
    res.status(200).json({ success: true, data: suppliers });
  } catch (error) { next(error); }
}

async function getSupplier(req, res, next) {
  try {
    const supplier = await supplierModel.getById(req.params.id);
    if (!supplier) throw new AppError(404, 'Supplier not found');
    res.status(200).json({ success: true, data: supplier });
  } catch (error) { next(error); }
}

async function createSupplier(req, res, next) {
  try {
    const id = await supplierModel.create(readSupplierBody(req.body));
    const supplier = await supplierModel.getById(id);
    res.status(201).json({ success: true, message: 'Supplier registered', data: supplier });
  } catch (error) { next(error); }
}

async function updateSupplier(req, res, next) {
  try {
    const data = readSupplierBody(req.body);
    if (!(await supplierModel.getById(req.params.id))) throw new AppError(404, 'Supplier not found');
    await supplierModel.update(req.params.id, data);
    res.status(200).json({ success: true, message: 'Supplier updated', data: await supplierModel.getById(req.params.id) });
  } catch (error) { next(error); }
}

// Business rule: a supplier that has purchases can not be deleted,
// because the purchase history must stay correct.
async function deleteSupplier(req, res, next) {
  try {
    if (!(await supplierModel.getById(req.params.id))) throw new AppError(404, 'Supplier not found');
    const purchaseCount = await supplierModel.countPurchases(req.params.id);
    if (purchaseCount > 0) {
      throw new AppError(409, `Supplier can not be deleted: it has ${purchaseCount} recorded purchase(s)`);
    }
    await supplierModel.remove(req.params.id);
    res.status(200).json({ success: true, message: 'Supplier deleted' });
  } catch (error) { next(error); }
}

module.exports = { getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier };
