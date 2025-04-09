const request = require('supertest');
const path = require('path');
const mongoose = require('mongoose');
const { app, connectDB } = require('../index');
const FileData = require('../models/FileData');

let server;

describe('File Upload API Tests', () => {
  beforeAll(async () => {
    await connectDB();
    server = app.listen(0);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await server.close();
  });

  beforeEach(async () => {
    await FileData.deleteMany({});
  });

  describe('POST /api/files/upload', () => {
    test('should successfully upload and parse an XLSX file', async () => {
      const response = await request(server)
        .post('/api/files/upload')
        .attach('file', path.join(__dirname, 'fixtures/valid-test.xlsx'));

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'File uploaded and processed successfully');
      expect(response.body).toHaveProperty('fileId');
      expect(mongoose.Types.ObjectId.isValid(response.body.fileId)).toBeTruthy();
    });

    test('should reject txt files', async () => {
      const response = await request(server)
        .post('/api/files/upload')
        .attach('file', path.join(__dirname, 'fixtures/invalid.txt'));

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid file type. Only .xlsx files are allowed');
    });

    test('should handle empty files', async () => {
      const response = await request(server)
        .post('/api/files/upload')
        .attach('file', path.join(__dirname, 'fixtures/empty.xlsx'));

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'File is empty or contains no valid data');
    });
  });

  describe('GET /api/files/:fileId', () => {
    test('should retrieve file data by ID', async () => {
      // First upload a file
      const uploadResponse = await request(server)
        .post('/api/files/upload')
        .attach('file', path.join(__dirname, 'fixtures/valid-test.xlsx'));

      const fileId = uploadResponse.body.fileId;

      // Then retrieve the file data
      const getResponse = await request(server)
        .get(`/api/files/${fileId}`);

      expect(getResponse.status).toBe(200);
      expect(Array.isArray(getResponse.body.data)).toBeTruthy();
      expect(getResponse.body.data.length).toBeGreaterThan(0);
    });

    test('should return 404 for non-existent file', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(server)
        .get(`/api/files/${nonExistentId}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'File not found');
    });
  });
}); 