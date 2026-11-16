const express = require('express');
const c = require('../controllers/supplierController');
const validateId = require('../middleware/validateId');
const router = express.Router();

router.get('/', c.getSuppliers);
router.post('/', c.createSupplier);
router.get('/:id', validateId(), c.getSupplier);
router.put('/:id', validateId(), c.updateSupplier);
router.delete('/:id', validateId(), c.deleteSupplier);

module.exports = router;
