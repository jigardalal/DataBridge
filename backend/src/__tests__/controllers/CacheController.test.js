const CacheController = require('../../controllers/CacheController');
const CacheManager = require('../../services/CacheManager');

jest.mock('../../services/CacheManager');

describe('CacheController', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      params: {},
      headers: {},
      user: null
    };
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getStats', () => {
    it('should return cache statistics', async () => {
      const mockStats = {
        connected_clients: 1,
        used_memory: '2.5MB',
        total_keys: 50
      };

      CacheManager.prototype.getStats.mockResolvedValue(mockStats);

      await CacheController.getStats(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockStats);
    });

    it('should handle errors', async () => {
      CacheManager.prototype.getStats.mockRejectedValue(new Error('Test error'));

      await CacheController.getStats(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to get cache statistics' });
    });
  });

  describe('clearCache', () => {
    it('should clear the cache successfully', async () => {
      await CacheController.clearCache(mockReq, mockRes);

      expect(CacheManager.prototype.clear).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Cache cleared successfully' });
    });

    it('should handle errors', async () => {
      CacheManager.prototype.clear.mockRejectedValue(new Error('Test error'));

      await CacheController.clearCache(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to clear cache' });
    });
  });

  describe('deleteCacheEntry', () => {
    it('should delete a cache entry successfully', async () => {
      mockReq.params = { key: 'test-key' };

      await CacheController.deleteCacheEntry(mockReq, mockRes);

      expect(CacheManager.prototype.delete).toHaveBeenCalledWith('test-key');
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Cache entry deleted successfully' });
    });

    it('should handle errors', async () => {
      mockReq.params = { key: 'test-key' };
      CacheManager.prototype.delete.mockRejectedValue(new Error('Test error'));

      await CacheController.deleteCacheEntry(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to delete cache entry' });
    });
  });

  describe('checkHealth', () => {
    it('should check cache health successfully', async () => {
      CacheManager.prototype.isHealthy.mockResolvedValue(true);

      await CacheController.checkHealth(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({ healthy: true });
    });

    it('should handle errors', async () => {
      CacheManager.prototype.isHealthy.mockRejectedValue(new Error('Test error'));

      await CacheController.checkHealth(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to check cache health' });
    });
  });

  describe('cache invalidation', () => {
    it('should handle cache expiration', async () => {
      const key = 'test-key';
      const value = 'test-value';
      const ttl = 1; // 1 second TTL

      // Set value with TTL
      CacheManager.prototype.set.mockResolvedValue(true);
      await CacheController.setCacheEntry({ ...mockReq, body: { key, value, ttl } }, mockRes);

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Try to get expired value
      CacheManager.prototype.get.mockResolvedValue(null);
      await CacheController.getCacheEntry({ ...mockReq, params: { key } }, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({ value: null });
    });

    it('should handle cache updates', async () => {
      const key = 'test-key';
      const oldValue = 'old-value';
      const newValue = 'new-value';

      // Set initial value
      CacheManager.prototype.set.mockResolvedValue(true);
      await CacheController.setCacheEntry({ ...mockReq, body: { key, value: oldValue } }, mockRes);

      // Update value
      await CacheController.setCacheEntry({ ...mockReq, body: { key, value: newValue } }, mockRes);

      // Get updated value
      CacheManager.prototype.get.mockResolvedValue(newValue);
      await CacheController.getCacheEntry({ ...mockReq, params: { key } }, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({ value: newValue });
    });
  });

  describe('authentication', () => {
    it('should allow public access to stats endpoint', async () => {
      mockReq.user = null;
      const mockStats = { connected_clients: 1 };

      CacheManager.prototype.getStats.mockResolvedValue(mockStats);

      await CacheController.getStats(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockStats);
    });

    it('should allow public access to health endpoint', async () => {
      mockReq.user = null;

      CacheManager.prototype.isHealthy.mockResolvedValue(true);

      await CacheController.checkHealth(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({ healthy: true });
    });

    it('should require admin role for clear endpoint', async () => {
      mockReq.user = { role: 'user' };

      await CacheController.clearCache(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Forbidden' });
    });

    it('should require admin role for delete endpoint', async () => {
      mockReq.user = { role: 'user' };
      mockReq.params = { key: 'test-key' };

      await CacheController.deleteCacheEntry(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Forbidden' });
    });
  });

  describe('edge cases', () => {
    it('should handle empty cache', async () => {
      CacheManager.prototype.getStats.mockResolvedValue({
        connected_clients: 0,
        used_memory: '0B',
        total_keys: 0
      });

      await CacheController.getStats(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        connected_clients: 0,
        used_memory: '0B',
        total_keys: 0
      });
    });

    it('should handle large cache entries', async () => {
      const largeValue = 'x'.repeat(1024 * 1024); // 1MB string
      mockReq.body = { key: 'large-key', value: largeValue };

      CacheManager.prototype.set.mockResolvedValue(true);

      await CacheController.setCacheEntry(mockReq, mockRes);

      expect(CacheManager.prototype.set).toHaveBeenCalledWith('large-key', largeValue);
    });

    it('should handle invalid cache keys', async () => {
      mockReq.params = { key: 'invalid/key' };

      await CacheController.getCacheEntry(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid cache key' });
    });
  });
}); 