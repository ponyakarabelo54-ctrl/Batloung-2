const express = require('express');
const c = require('../controllers/saleController');
const validateId = require('../middleware/validateId');
const router = express.Router();

router.get('/', c.getSales);
router.get('/prices', c.getDefaultPrices);
router.post('/', c.createSale);
router.get('/:id', validateId(), c.getSale);
router.post('/:id/payments', validateId(), c.addPayment);

module.exports = router;
