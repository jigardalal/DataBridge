const request = require('supertest');
const path = require('path');
const mongoose = require('mongoose');
const { app, connectDB } = require('../../index');
const FileData = require('../../models/FileData');
const mockConsole = require('../helpers/consoleMock');
const XLSX = require('xlsx');

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
        .attach('file', path.join(__dirname, 'fixtures', 'valid-test.xlsx'));

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
        .attach('file', path.join(__dirname, 'fixtures', 'invalid.txt'));

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
        .attach('file', path.join(__dirname, 'fixtures', 'empty.xlsx'));

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'File is empty or contains no valid data');
      expect(consoleSpy.log).toHaveBeenCalledWith('Received file:', expect.objectContaining({
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        originalname: 'empty.xlsx'
      }));
    });

    it('should handle request without file', async () => {
      const response = await request(server)
        .post('/api/files/upload');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'No file uploaded');
      expect(consoleSpy.log).toHaveBeenCalledWith('No file received in request');
    });

    it('should handle corrupted XLSX file', async () => {
      // Create a corrupted XLSX file (with XLSX header but invalid content)
      const corruptedBuffer = Buffer.from('504b0304' + '0A0A0A0A', 'hex'); // Invalid ZIP/XLSX structure
      
      const response = await request(server)
        .post('/api/files/upload')
        .attach('file', corruptedBuffer, 'corrupted.xlsx');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Error parsing file. Please ensure it is a valid Excel/CSV file.');
      expect(consoleSpy.error).toHaveBeenCalledWith('Error parsing file:', expect.any(Error));
    });

    it('should handle file with only empty rows', async () => {
      // Create an XLSX with only empty rows
      const workbook = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([
        ['', '', ''],
        ['', '', ''],
        ['', '', '']
      ]);
      XLSX.utils.book_append_sheet(workbook, ws, 'Sheet1');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const response = await request(server)
        .post('/api/files/upload')
        .attach('file', buffer, 'empty-rows.xlsx');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'File is empty or contains no valid data');
      expect(consoleSpy.log).toHaveBeenCalledWith('File is empty after filtering blank rows');
    });
  });

  describe('GET /api/files/:fileId', () => {
    it('should retrieve file data by ID', async () => {
      // First upload a file
      const uploadResponse = await request(server)
        .post('/api/files/upload')
        .attach('file', path.join(__dirname, 'fixtures', 'valid-test.xlsx'));

      const fileId = uploadResponse.body.fileId;

      // Then get the file data
      const response = await request(server)
        .get(`/api/files/${fileId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('_id', fileId);
      expect(response.body).toHaveProperty('fileName', 'valid-test.xlsx');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('columnHeaders');
      expect(response.body).toHaveProperty('rowCount');
    });

    it('should return 404 for non-existent file', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(server)
        .get(`/api/files/${nonExistentId}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'File not found');
    });

    it('should handle invalid ObjectId format', async () => {
      const response = await request(server)
        .get('/api/files/invalid-id');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Error retrieving file data');
      expect(consoleSpy.error).toHaveBeenCalledWith('Error retrieving file data:', expect.any(Error));
    });

    it('should handle database errors', async () => {
      // Force a database error by passing a valid ObjectId format but with incorrect length
      const invalidId = 'abcd1234';
      const response = await request(server)
        .get(`/api/files/${invalidId}`);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Error retrieving file data');
      expect(consoleSpy.error).toHaveBeenCalledWith('Error retrieving file data:', expect.any(Error));
    });
  });
}); 