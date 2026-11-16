const express = require('express');
const c = require('../controllers/reportController');
const router = express.Router();

router.get('/dashboard', c.dashboard);
router.get('/top-fruits', c.topFruits);
router.get('/revenue', c.revenue);
router.get('/top-vendor', c.topVendor);
router.get('/stock', c.currentStock);
router.get('/outstanding-balances', c.outstandingBalances);

module.exports = router;
