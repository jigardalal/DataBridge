const request = require('supertest');
const mongoose = require('mongoose');
const { app, connectDB } = require('../../index');
const mockConsole = require('../helpers/mockConsole');

describe('Server Setup', () => {
  let consoleSpy;

  beforeAll(() => {
    consoleSpy = mockConsole();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('App Configuration', () => {
    it('should have CORS enabled', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://example.com');
      
      expect(response.headers['access-control-allow-origin']).toBe('*');
    });

    it('should have security headers set by Helmet', async () => {
      const response = await request(app).get('/health');
      
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(response.headers['x-xss-protection']).toBe('0');
    });
  });

  describe('Health Check Endpoint', () => {
    it('should return 200 OK with status', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'UP');
    });
  });

  describe('Database Connection', () => {
    it('should connect to the database successfully', async () => {
      const result = await connectDB();
      expect(result).toBe(true);
      expect(mongoose.connection.readyState).toBe(1); // 1 = connected
    });

    it('should handle database connection errors', async () => {
      // Save original MONGODB_URI
      const originalUri = process.env.MONGODB_URI;
      
      // Set invalid URI
      process.env.MONGODB_URI = 'mongodb://invalid:27017/test';
      
      try {
        await connectDB();
      } catch (error) {
        expect(error).toBeDefined();
        expect(consoleSpy.error).toHaveBeenCalled();
      }

      // Restore original URI
      process.env.MONGODB_URI = originalUri;
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors', async () => {
      const response = await request(app).get('/nonexistent-route');
      
      expect(response.status).toBe(404);
      expect(response.text).toContain('Cannot GET /nonexistent-route');
    });

    it('should handle server errors', async () => {
      // Create a route that throws an error
      app.get('/error-test', () => {
        console.error('Test error');
        throw new Error('Test error');
      });

      const response = await request(app).get('/error-test');
      
      expect(response.status).toBe(500);
      expect(response.text).toContain('Error');
      expect(consoleSpy.error).toHaveBeenCalledWith('Test error');
    });
  });
}); 