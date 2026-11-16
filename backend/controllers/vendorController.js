const vendorModel = require('../models/vendorModel');
const AppError = require('../utils/AppError');
const { cleanText, cleanPhone, cleanDateOnly } = require('../utils/validators');

function readVendorBody(body) {
  return {
    vendor_name: cleanText(body.vendor_name, 'vendor_name', { maxLength: 100 }),
    phone_number: cleanPhone(body.phone_number, 'phone_number'),
    location: cleanText(body.location, 'location', { maxLength: 150 }),
    registration_date: body.registration_date ? cleanDateOnly(body.registration_date, 'registration_date') : null,
  };
}

// GET /api/vendors            -> all vendors
// GET /api/vendors?search=abc -> vendors whose name or phone contains "abc"
async function getVendors(req, res, next) {
  try {
    const search = req.query.search ? String(req.query.search).trim() : '';
    res.status(200).json({ success: true, data: await vendorModel.getAll(search) });
  } catch (error) { next(error); }
}

async function getVendor(req, res, next) {
  try {
    const vendor = await vendorModel.getById(req.params.id);
    if (!vendor) throw new AppError(404, 'Vendor not found');
    res.status(200).json({ success: true, data: vendor });
  } catch (error) { next(error); }
}

async function createVendor(req, res, next) {
  try {
    const id = await vendorModel.create(readVendorBody(req.body));
    res.status(201).json({ success: true, message: 'Vendor registered', data: await vendorModel.getById(id) });
  } catch (error) { next(error); }
}

async function updateVendor(req, res, next) {
  try {
    const data = readVendorBody(req.body);
    if (!(await vendorModel.getById(req.params.id))) throw new AppError(404, 'Vendor not found');
    await vendorModel.update(req.params.id, data);
    res.status(200).json({ success: true, message: 'Vendor updated', data: await vendorModel.getById(req.params.id) });
  } catch (error) { next(error); }
}

module.exports = { getVendors, getVendor, createVendor, updateVendor };
