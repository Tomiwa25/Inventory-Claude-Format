const express = require('express');
const router = express.Router();
const soController = require('../Controllers/SalesOrderController');
const { protect, authorize } = require('../Middleware/authMiddleware');

router.use(protect);

router.post('/', authorize('superadmin', 'salesperson'), soController.createSalesOrder);
router.get('/', soController.getAllSalesOrders);
router.get('/:id', soController.getSalesOrderById);
router.post('/:id/fulfill', authorize('superadmin', 'storekeeper', 'salesperson'), soController.fulfillSalesOrder);
router.post('/:id/cancel', authorize('superadmin', 'salesperson'), soController.cancelSalesOrder);

module.exports = router;
