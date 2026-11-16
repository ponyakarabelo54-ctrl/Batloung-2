const express = require('express');
const c = require('../controllers/fruitController');
const validateId = require('../middleware/validateId');
const router = express.Router();

router.get('/', c.getFruits);
router.post('/', c.createFruit);
router.get('/:id', validateId(), c.getFruit);
router.put('/:id', validateId(), c.updateFruit);
router.patch('/:id/status', validateId(), c.changeFruitStatus);

module.exports = router;
