const express = require('express');
const c = require('../controllers/stockController');
const validateId = require('../middleware/validateId');
const router = express.Router();

router.get('/', c.getStock);
router.get('/low', c.getLowStock);
router.get('/fruit/:id', validateId(), c.getStockForFruit);

module.exports = router;
