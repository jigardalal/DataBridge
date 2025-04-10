const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/TokenController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Public routes
router.get('/stats', tokenController.getStats);
router.post('/check', tokenController.checkLimits);

// Admin routes
router.post('/reset', authenticate, authorize(['admin']), tokenController.resetDailyUsage);

module.exports = router;
