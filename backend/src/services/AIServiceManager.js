const TokenManager = require('./TokenManager');
const CacheManager = require('./CacheManager');

class AIServiceManager {
  constructor(config = {}) {
    this.tokenManager = new TokenManager(config.tokenManager);
    this.cacheManager = new CacheManager(config.cacheManager);
    this.config = config;
  }

  /**
   * Process AI request with caching and token management
   * @param {Object} params - Request parameters
   * @param {Function} processFn - Function to process the request
   * @returns {Promise<Object>} Processed response
   */
  async processRequest(params, processFn) {
    // Generate cache key
    const cacheKey = this.cacheManager.generateCacheKey(params);

    // Check cache first
    const cachedResponse = await this.cacheManager.get(cacheKey);
    if (cachedResponse) {
      return {
        ...cachedResponse,
        cached: true
      };
    }

    // Check token limits
    const tokenCheck = await this.tokenManager.checkLimits(params.estimatedTokens);
    if (!tokenCheck.allowed) {
      throw new Error(`Token limit exceeded: ${tokenCheck.reason}`);
    }

    // Process request
    const response = await processFn(params);

    // Record token usage
    await this.tokenManager.recordUsage({
      tokens: response.tokensUsed,
      endpoint: params.endpoint,
      model: params.model
    });

    // Cache response
    await this.cacheManager.set(cacheKey, response);

    return {
      ...response,
      cached: false
    };
  }

  /**
   * Get service statistics
   * @returns {Promise<Object>} Service statistics
   */
  async getStats() {
    const [tokenStats, cacheStats] = await Promise.all([
      this.tokenManager.getUsageStats(),
      this.cacheManager.getStats()
    ]);

    return {
      tokenUsage: tokenStats,
      cache: cacheStats
    };
  }

  /**
   * Check service health
   * @returns {Promise<boolean>} Service health status
   */
  async isHealthy() {
    const [tokenHealth, cacheHealth] = await Promise.all([
      this.tokenManager.isHealthy(),
      this.cacheManager.isHealthy()
    ]);

    return tokenHealth && cacheHealth;
  }

  /**
   * Clear cache and reset token usage (for testing/emergencies)
   */
  async reset() {
    await Promise.all([
      this.cacheManager.clear(),
      this.tokenManager.resetDailyUsage()
    ]);
  }
}

module.exports = AIServiceManager; 