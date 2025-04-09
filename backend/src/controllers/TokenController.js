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
      if (!estimatedTokens || typeof estimatedTokens !== 'number') {
        return res.status(400).json({ error: 'Invalid estimatedTokens value' });
      }

      const result = await this.tokenManager.checkLimits(estimatedTokens);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to check token limits' });
    }
  }

  /**
   * Reset daily token usage (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async resetDailyUsage(req, res) {
    try {
      await this.tokenManager.resetDailyUsage();
      res.json({ message: 'Daily token usage reset successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to reset token usage' });
    }
  }
}

module.exports = new TokenController(); 