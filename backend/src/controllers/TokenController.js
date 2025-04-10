const TokenManager = require('../services/TokenManager');

class TokenController {
  constructor() {
    this.tokenManager = new TokenManager();
  }

  /**
   * Get token usage statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getStats(req, res) {
    try {
      const stats = await this.tokenManager.getUsageStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get token statistics' });
    }
  }

  /**
   * Check if a request with estimated tokens would be allowed
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async checkLimits(req, res) {
    try {
      const { estimatedTokens } = req.body;
      if (!estimatedTokens || typeof estimatedTokens !== 'number' || estimatedTokens < 0) {
        return res.status(400).json({ error: 'Invalid estimatedTokens value' });
      }

      const result = await this.tokenManager.checkLimits(estimatedTokens);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to check token limits' });
    }
  }

  /**
   * Record token usage for a request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async recordUsage(req, res) {
    try {
      const { tokens, endpoint, model } = req.body;
      
      if (!tokens || typeof tokens !== 'number' || tokens < 0) {
        return res.status(400).json({ error: 'Invalid tokens value' });
      }

      await this.tokenManager.recordUsage(tokens, endpoint, model);
      res.json({ message: 'Token usage recorded successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to record token usage' });
    }
  }

  /**
   * Reset daily token usage (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async resetDailyUsage(req, res) {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }
      await this.tokenManager.resetDailyUsage();
      res.json({ message: 'Daily token usage reset successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to reset token usage' });
    }
  }
}

module.exports = new TokenController(); 