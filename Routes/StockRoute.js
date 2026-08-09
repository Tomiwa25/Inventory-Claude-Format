const express = require('express');
const router = express.Router();
const stockController = require('../Controllers/StockController');
const { protect, authorize } = require('../Middleware/authMiddleware');

router.use(protect);

router.post('/in', authorize('superadmin', 'storekeeper'), stockController.stockIn);
router.post('/out', authorize('superadmin', 'storekeeper', 'salesperson'), stockController.stockOut);
router.post('/adjust', authorize('superadmin', 'storekeeper'), stockController.adjustStock);
router.get('/movements', stockController.getMovements);
router.get('/low-stock', stockController.getLowStock);
router.get('/valuation', authorize('superadmin', 'storekeeper'), stockController.getStockValuation);

module.exports = router;
