const TokenController = require('../../controllers/TokenController');
const TokenManager = require('../../services/TokenManager');

jest.mock('../../services/TokenManager');

describe('TokenController', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      body: {},
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
    it('should return token usage statistics', async () => {
      const mockStats = {
        dailyUsage: 5000,
        dailyLimit: 100000,
        perRequestLimit: 1000
      };

      TokenManager.prototype.getUsageStats.mockResolvedValue(mockStats);

      await TokenController.getStats(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockStats);
    });

    it('should handle errors', async () => {
      TokenManager.prototype.getUsageStats.mockRejectedValue(new Error('Test error'));

      await TokenController.getStats(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to get token statistics' });
    });
  });

  describe('checkLimits', () => {
    it('should check token limits successfully', async () => {
      mockReq.body = { estimatedTokens: 100 };
      const mockResult = { allowed: true, remaining: 9900 };

      TokenManager.prototype.checkLimits.mockResolvedValue(mockResult);

      await TokenController.checkLimits(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });

    it('should return 400 for invalid estimatedTokens', async () => {
      mockReq.body = { estimatedTokens: 'invalid' };

      await TokenController.checkLimits(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid estimatedTokens value' });
    });

    it('should handle errors', async () => {
      mockReq.body = { estimatedTokens: 100 };
      TokenManager.prototype.checkLimits.mockRejectedValue(new Error('Test error'));

      await TokenController.checkLimits(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to check token limits' });
    });
  });

  describe('resetDailyUsage', () => {
    it('should reset daily token usage', async () => {
      await TokenController.resetDailyUsage(mockReq, mockRes);

      expect(TokenManager.prototype.resetDailyUsage).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Daily token usage reset successfully' });
    });

    it('should handle errors', async () => {
      TokenManager.prototype.resetDailyUsage.mockRejectedValue(new Error('Test error'));

      await TokenController.resetDailyUsage(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to reset token usage' });
    });
  });

  describe('concurrent requests', () => {
    it('should handle multiple token checks simultaneously', async () => {
      const requests = Array(10).fill().map(() => ({
        body: { estimatedTokens: 100 },
        user: { role: 'user' }
      }));

      TokenManager.prototype.checkLimits.mockResolvedValue({ allowed: true, remaining: 9000 });

      const results = await Promise.all(
        requests.map(req => TokenController.checkLimits(req, mockRes))
      );

      expect(TokenManager.prototype.checkLimits).toHaveBeenCalledTimes(10);
      results.forEach(result => {
        expect(result).toBeUndefined(); // Controller methods don't return values
      });
    });

    it('should handle concurrent token usage updates', async () => {
      const requests = Array(5).fill().map(() => ({
        body: { tokens: 100, endpoint: '/test', model: 'gpt-4' },
        user: { role: 'user' }
      }));

      TokenManager.prototype.recordUsage.mockResolvedValue(true);

      await Promise.all(
        requests.map(req => TokenController.recordUsage(req, mockRes))
      );

      expect(TokenManager.prototype.recordUsage).toHaveBeenCalledTimes(5);
    });
  });

  describe('authentication', () => {
    it('should allow public access to stats endpoint', async () => {
      mockReq.user = null;
      const mockStats = { dailyUsage: 5000 };

      TokenManager.prototype.getUsageStats.mockResolvedValue(mockStats);

      await TokenController.getStats(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockStats);
    });

    it('should allow public access to check endpoint', async () => {
      mockReq.user = null;
      mockReq.body = { estimatedTokens: 100 };
      const mockResult = { allowed: true, remaining: 9900 };

      TokenManager.prototype.checkLimits.mockResolvedValue(mockResult);

      await TokenController.checkLimits(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });

    it('should require admin role for reset endpoint', async () => {
      mockReq.user = { role: 'user' };

      await TokenController.resetDailyUsage(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Forbidden' });
    });

    it('should allow admin access to reset endpoint', async () => {
      mockReq.user = { role: 'admin' };

      await TokenController.resetDailyUsage(mockReq, mockRes);

      expect(TokenManager.prototype.resetDailyUsage).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Daily token usage reset successfully' });
    });
  });

  describe('edge cases', () => {
    it('should handle zero token requests', async () => {
      mockReq.body = { estimatedTokens: 0 };
      const mockResult = { allowed: true, remaining: 10000 };

      TokenManager.prototype.checkLimits.mockResolvedValue(mockResult);

      await TokenController.checkLimits(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle maximum token requests', async () => {
      mockReq.body = { estimatedTokens: 1000 }; // Assuming 1000 is max per request
      const mockResult = { allowed: true, remaining: 0 };

      TokenManager.prototype.checkLimits.mockResolvedValue(mockResult);

      await TokenController.checkLimits(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle negative token values', async () => {
      mockReq.body = { estimatedTokens: -100 };

      await TokenController.checkLimits(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid estimatedTokens value' });
    });
  });
}); 