const express = require('express');
const router = express.Router();
const categoryController = require('../Controllers/CategoryController');
const { protect, authorize } = require('../Middleware/authMiddleware');

router.use(protect);

router.post('/', authorize('superadmin', 'storekeeper'), categoryController.createCategory);
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);
router.put('/:id', authorize('superadmin', 'storekeeper'), categoryController.updateCategory);
router.delete('/:id', authorize('superadmin'), categoryController.deleteCategory);

module.exports = router;
