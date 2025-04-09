const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const FileData = require('../models/FileData');
const path = require('path');

describe('File Upload API', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
  });

  afterAll(async () => {
    // Clean up database and close connection
    await FileData.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear collection before each test
    await FileData.deleteMany({});
  });

  describe('POST /api/files/upload', () => {
    test('should upload and parse XLSX file successfully', async () => {
      const response = await request(app)
        .post('/api/files/upload')
        .attach('file', path.join(__dirname, 'fixtures/test.xlsx'));

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('fileId');
      expect(response.body).toHaveProperty('rowCount');
      expect(response.body).toHaveProperty('headers');
    });

    test('should reject invalid file type', async () => {
      const response = await request(app)
        .post('/api/files/upload')
        .attach('file', path.join(__dirname, 'fixtures/test.txt'));

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should handle empty file', async () => {
      const response = await request(app)
        .post('/api/files/upload')
        .attach('file', path.join(__dirname, 'fixtures/empty.xlsx'));

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('File is empty');
    });
  });

  describe('GET /api/files/:fileId', () => {
    test('should retrieve file data successfully', async () => {
      // First upload a file
      const uploadResponse = await request(app)
        .post('/api/files/upload')
        .attach('file', path.join(__dirname, 'fixtures/test.xlsx'));

      const fileId = uploadResponse.body.fileId;

      // Then retrieve it
      const getResponse = await request(app)
        .get(`/api/files/${fileId}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body).toHaveProperty('data');
      expect(getResponse.body).toHaveProperty('fileName');
      expect(getResponse.body).toHaveProperty('fileType');
    });

    test('should return 404 for non-existent file', async () => {
      const response = await request(app)
        .get('/api/files/123456789012345678901234');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('File data not found');
    });
  });
}); 