const request = require('supertest');
const path = require('path');
const mongoose = require('mongoose');
const { app, connectDB } = require('../index');
const FileData = require('../models/FileData');
const mockConsole = require('./helpers/consoleMock');

let server;
const consoleSpy = mockConsole();

describe('File Upload API Tests', () => {
  beforeAll(async () => {
    await connectDB();
    server = app.listen();
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await server.close();
  });

  beforeEach(async () => {
    await FileData.deleteMany({});
    // Clear all mock calls between tests
    consoleSpy.log.mockClear();
    consoleSpy.error.mockClear();
  });

  describe('POST /api/files/upload', () => {
    it('should successfully upload and parse an XLSX file', async () => {
      const response = await request(server)
        .post('/api/files/upload')
        .attach('file', '__tests__/fixtures/valid-test.xlsx');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('fileId');
      expect(mongoose.Types.ObjectId.isValid(response.body.fileId)).toBeTruthy();
      // Verify the sequence of log messages
      expect(consoleSpy.log).toHaveBeenNthCalledWith(1, 'Received file:', expect.objectContaining({
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        originalname: 'valid-test.xlsx'
      }));
      expect(consoleSpy.log).toHaveBeenCalledWith('File validation passed');
      expect(consoleSpy.log).toHaveBeenCalledWith('File upload request received');
    });

    it('should reject txt files', async () => {
      const response = await request(server)
        .post('/api/files/upload')
        .attach('file', '__tests__/fixtures/invalid.txt');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid file type. Only .xlsx files are allowed');
      expect(consoleSpy.log).toHaveBeenCalledWith('Received file:', expect.objectContaining({
        mimetype: 'text/plain',
        originalname: 'invalid.txt'
      }));
    });

    it('should handle empty files', async () => {
      const response = await request(server)
        .post('/api/files/upload')
        .attach('file', '__tests__/fixtures/empty.xlsx');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'File is empty or contains no valid data');
      expect(consoleSpy.log).toHaveBeenCalledWith('Received file:', expect.objectContaining({
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        originalname: 'empty.xlsx'
      }));
    });
  });

  describe('GET /api/files/:fileId', () => {
    it('should retrieve file data by ID', async () => {
      // First upload a file
      const uploadResponse = await request(server)
        .post('/api/files/upload')
        .attach('file', '__tests__/fixtures/valid-test.xlsx');

      const fileId = uploadResponse.body.fileId;

      // Then get the file data
      const response = await request(server)
        .get(`/api/files/${fileId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('_id', fileId);
      expect(response.body).toHaveProperty('filename', 'valid-test.xlsx');
      expect(response.body).toHaveProperty('status');
    });

    it('should return 404 for non-existent file', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(server)
        .get(`/api/files/${nonExistentId}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'File not found');
      expect(consoleSpy.log).toHaveBeenCalledWith('File not found:', nonExistentId.toString());
    });
  });
}); 