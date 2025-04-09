const CacheManager = require('../services/CacheManager');

class CacheController {
  constructor() {
    this.cacheManager = new CacheManager();
  }

  /**
   * Get cache statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getStats(req, res) {
    try {
      const stats = await this.cacheManager.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get cache statistics' });
    }
  }

  /**
   * Clear the entire cache
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async clearCache(req, res) {
    try {
      await this.cacheManager.clear();
      res.json({ message: 'Cache cleared successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to clear cache' });
    }
  }

  /**
   * Delete a specific cache entry
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteCacheEntry(req, res) {
    try {
      const { key } = req.params;
      await this.cacheManager.delete(key);
      res.json({ message: 'Cache entry deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete cache entry' });
    }
  }

  /**
   * Check cache health
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async checkHealth(req, res) {
    try {
      const isHealthy = await this.cacheManager.isHealthy();
      res.json({ healthy: isHealthy });
    } catch (error) {
      res.status(500).json({ error: 'Failed to check cache health' });
    }
  }
}

module.exports = new CacheController(); 