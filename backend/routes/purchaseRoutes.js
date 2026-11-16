const express = require('express');
const c = require('../controllers/purchaseController');
const validateId = require('../middleware/validateId');
const router = express.Router();

router.get('/', c.getPurchases);
router.post('/', c.createPurchase);
router.get('/:id', validateId(), c.getPurchase);

module.exports = router;
