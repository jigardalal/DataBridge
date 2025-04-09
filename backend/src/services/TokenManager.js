const mongoose = require('mongoose');

/**
 * Token usage schema for tracking daily usage
 */
const tokenUsageSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: () => new Date().setHours(0, 0, 0, 0)
  },
  totalTokens: {
    type: Number,
    required: true,
    default: 0
  },
  requests: [{
    timestamp: { type: Date, required: true },
    tokens: { type: Number, required: true },
    endpoint: { type: String, required: true },
    model: { type: String, required: true }
  }]
});

const TokenUsage = mongoose.model('TokenUsage', tokenUsageSchema);

class TokenManager {
  constructor(config = {}) {
    this.dailyLimit = config.dailyLimit || 1000000; // Default 1M tokens per day
    this.requestLimit = config.requestLimit || 10000; // Default 10K tokens per request
    this.warningThreshold = config.warningThreshold || 0.8; // 80% of limit
  }

  /**
   * Check if request is within limits
   * @param {number} estimatedTokens - Estimated tokens for request
   * @returns {Promise<{allowed: boolean, reason?: string, remaining?: number}>}
   */
  async checkLimits(estimatedTokens) {
    const today = new Date().setHours(0, 0, 0, 0);
    const usage = await TokenUsage.findOne({ date: today }) || 
                 new TokenUsage({ date: today });

    // Check daily limit
    if (usage.totalTokens + estimatedTokens > this.dailyLimit) {
      return {
        allowed: false,
        reason: 'Daily token limit exceeded',
        remaining: this.dailyLimit - usage.totalTokens
      };
    }

    // Check per-request limit
    if (estimatedTokens > this.requestLimit) {
      return {
        allowed: false,
        reason: 'Request token limit exceeded',
        remaining: this.requestLimit
      };
    }

    // Check warning threshold
    const usagePercentage = usage.totalTokens / this.dailyLimit;
    if (usagePercentage >= this.warningThreshold) {
      return {
        allowed: true,
        warning: 'Approaching daily token limit',
        remaining: this.dailyLimit - usage.totalTokens
      };
    }

    return { allowed: true };
  }

  /**
   * Record token usage
   * @param {Object} usage - Usage details
   * @param {number} usage.tokens - Number of tokens used
   * @param {string} usage.endpoint - API endpoint
   * @param {string} usage.model - Model used
   */
  async recordUsage(usage) {
    const today = new Date().setHours(0, 0, 0, 0);
    const tokenUsage = await TokenUsage.findOne({ date: today }) || 
                      new TokenUsage({ date: today });

    tokenUsage.totalTokens += usage.tokens;
    tokenUsage.requests.push({
      timestamp: new Date(),
      tokens: usage.tokens,
      endpoint: usage.endpoint,
      model: usage.model
    });

    await tokenUsage.save();
  }

  /**
   * Get usage statistics
   * @param {Date} startDate - Start date for statistics
   * @param {Date} endDate - End date for statistics
   * @returns {Promise<Object>} Usage statistics
   */
  async getUsageStats(startDate, endDate) {
    const stats = await TokenUsage.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalTokens: { $sum: '$totalTokens' },
          averageTokens: { $avg: '$totalTokens' },
          maxTokens: { $max: '$totalTokens' },
          requestCount: { $sum: { $size: '$requests' } }
        }
      }
    ]);

    return stats[0] || {
      totalTokens: 0,
      averageTokens: 0,
      maxTokens: 0,
      requestCount: 0
    };
  }

  /**
   * Get current day's usage
   * @returns {Promise<Object>} Today's usage
   */
  async getTodayUsage() {
    const today = new Date().setHours(0, 0, 0, 0);
    return TokenUsage.findOne({ date: today });
  }

  /**
   * Reset daily usage (for testing or emergency)
   */
  async resetDailyUsage() {
    const today = new Date().setHours(0, 0, 0, 0);
    await TokenUsage.deleteOne({ date: today });
  }
}

module.exports = TokenManager; 