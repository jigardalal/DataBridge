const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/TokenController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.get('/stats', tokenController.getStats);
router.post('/check', tokenController.checkLimits);

// Admin routes
router.post('/reset', authenticate, authorize(['admin']), tokenController.resetDailyUsage);

module.exports = router; 