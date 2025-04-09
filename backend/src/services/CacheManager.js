const Redis = require('ioredis');
const { promisify } = require('util');

class CacheManager {
  constructor(config = {}) {
    this.redis = new Redis(config.redisUrl || 'redis://localhost:6379');
    this.defaultTTL = config.defaultTTL || 3600; // 1 hour in seconds
    this.maxCacheSize = config.maxCacheSize || 1000; // Maximum number of cached items
  }

  /**
   * Generate cache key from request parameters
   * @param {Object} params - Request parameters
   * @returns {string} Cache key
   */
  generateCacheKey(params) {
    return JSON.stringify(params);
  }

  /**
   * Get cached response
   * @param {string} key - Cache key
   * @returns {Promise<Object|null>} Cached response or null
   */
  async get(key) {
    try {
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set cache with TTL
   * @param {string} key - Cache key
   * @param {Object} value - Value to cache
   * @param {number} ttl - Time to live in seconds
   */
  async set(key, value, ttl = this.defaultTTL) {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Delete cache entry
   * @param {string} key - Cache key
   */
  async delete(key) {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  /**
   * Clear all cache entries
   */
  async clear() {
    try {
      await this.redis.flushall();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Get cache statistics
   * @returns {Promise<Object>} Cache statistics
   */
  async getStats() {
    try {
      const info = await this.redis.info();
      const stats = {
        connected_clients: info.match(/connected_clients:(\d+)/)?.[1],
        used_memory: info.match(/used_memory:(\d+)/)?.[1],
        total_keys: await this.redis.dbsize()
      };
      return stats;
    } catch (error) {
      console.error('Cache stats error:', error);
      return null;
    }
  }

  /**
   * Check if cache is healthy
   * @returns {Promise<boolean>} Cache health status
   */
  async isHealthy() {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      console.error('Cache health check error:', error);
      return false;
    }
  }
}

module.exports = CacheManager; 