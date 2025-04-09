const express = require('express');
const router = express.Router();
const cacheController = require('../controllers/CacheController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.get('/stats', cacheController.getStats);
router.get('/health', cacheController.checkHealth);

// Admin routes
router.delete('/clear', authenticate, authorize(['admin']), cacheController.clearCache);
router.delete('/:key', authenticate, authorize(['admin']), cacheController.deleteCacheEntry);

module.exports = router; 