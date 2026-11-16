const express = require('express');
const c = require('../controllers/vendorController');
const validateId = require('../middleware/validateId');
const router = express.Router();

router.get('/', c.getVendors);          // supports ?search=name-or-phone
router.post('/', c.createVendor);
router.get('/:id', validateId(), c.getVendor);
router.put('/:id', validateId(), c.updateVendor);

module.exports = router;
