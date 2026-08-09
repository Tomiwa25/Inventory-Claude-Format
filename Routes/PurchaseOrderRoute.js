const express = require('express');
const router = express.Router();
const poController = require('../Controllers/PurchaseOrderController');
const { protect, authorize } = require('../Middleware/authMiddleware');

router.use(protect);
router.use(authorize('superadmin', 'storekeeper'));

router.post('/', poController.createPurchaseOrder);
router.get('/', poController.getAllPurchaseOrders);
router.get('/:id', poController.getPurchaseOrderById);
router.put('/:id/status', poController.updatePurchaseOrderStatus);
router.post('/:id/receive', poController.receivePurchaseOrder);

module.exports = router;
