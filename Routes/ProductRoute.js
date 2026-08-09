const express = require('express');
const router = express.Router();

// Import the product controller
const productController = require('../Controllers/ProductController');
const { protect, authorize } = require('../Middleware/authMiddleware');

router.use(protect);

//define routes for product operations
router.post('/createproduct', authorize('superadmin', 'storekeeper'), productController.createProduct);
router.put('/updateproduct/:id', authorize('superadmin', 'storekeeper'), productController.updateProduct);
router.get('/getallproducts', productController.getAllProducts);
router.get('/getproduct/:id', productController.getProductById);
router.delete('/deleteproduct/:id', authorize('superadmin'), productController.deleteProduct);

module.exports = router;
