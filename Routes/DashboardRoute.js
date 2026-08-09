const express = require('express');
const router = express.Router();
const dashboardController = require('../Controllers/DashboardController');
const { protect } = require('../Middleware/authMiddleware');

router.use(protect);
router.get('/summary', dashboardController.getSummary);

module.exports = router;
