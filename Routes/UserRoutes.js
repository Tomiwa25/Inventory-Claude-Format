const express = require('express');
const router = express.Router();

// Import the user controller
const userController = require('../Controllers/UserController');
const { protect, authorize } = require('../Middleware/authMiddleware');

//define routes for user operations
router.post('/createuser', protect, authorize('superadmin'), userController.createUser);
router.post('/login', userController.loginUser);
router.get('/me', protect, userController.getMe);

//export the router
module.exports = router;
