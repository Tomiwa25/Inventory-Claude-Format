const express = require('express');
const router = express.Router();
const supplierController = require('../Controllers/SupplierController');
const { protect, authorize } = require('../Middleware/authMiddleware');

router.use(protect);

router.post('/', authorize('superadmin', 'storekeeper'), supplierController.createSupplier);
router.get('/', supplierController.getAllSuppliers);
router.get('/:id', supplierController.getSupplierById);
router.put('/:id', authorize('superadmin', 'storekeeper'), supplierController.updateSupplier);
router.delete('/:id', authorize('superadmin'), supplierController.deleteSupplier);

module.exports = router;
