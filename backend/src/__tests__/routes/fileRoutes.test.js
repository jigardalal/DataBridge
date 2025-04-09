const request = require('supertest');
const express = require('express');
const multer = require('multer');
const fileRoutes = require('../../../routes/fileRoutes');
const { parseFile, getFileData } = require('../../../controllers/fileController');
const { FileData } = require('../../../models/FileData');

// Mock data matching the actual implementation response format
const mockFileData = {
  _id: 'test-file-id',
  fileName: 'test.xlsx',
  fileType: 'xlsx',
  data: [
    { name: 'John Doe', email: 'john@example.com' },
    { name: 'Jane Smith', email: 'jane@example.com' }
  ],
  columnHeaders: ['name', 'email'],
  rowCount: 2,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01')
};

const mockUploadResponse = {
  message: 'File uploaded and processed successfully',
  fileId: mockFileData._id,
  rowCount: mockFileData.rowCount,
  headers: mockFileData.columnHeaders,
  totalRowsBeforeFiltering: 3,
  blankRowsRemoved: 1
};

// Create a mock MulterError class for file upload error testing
class MockMulterError extends Error {
  constructor(code) {
    super('Multer error');
    this.name = 'MulterError';
    this.code = code;
  }
}

// Mock multer with configurable error scenarios
jest.mock('multer', () => {
  return jest.fn().mockImplementation(() => ({
    single: jest.fn()
  }));
});

// Mock FileData model with consistent error handling
jest.mock('../../../models/FileData', () => ({
  FileData: {
    findById: jest.fn()
  }
}));

// Mock middleware with comprehensive error handling
jest.mock('../../middleware/fileValidation', () => {
  const multerMock = jest.fn().mockImplementation((req, res, next) => next());
  return {
    upload: multerMock,
    handleFileUploadError: jest.fn((err, req, res, next) => {
      if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({ error: 'File size too large. Maximum size is 5MB.' });
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          res.status(400).json({ error: 'Unexpected field name for file upload. Use "file".' });
        } else {
          res.status(400).json({ error: 'File upload error' });
        }
      } else {
        next(err);
      }
    })
  };
});

describe('File Routes', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());

    // Configure multer with strict file type checking
    const storage = multer.memoryStorage();
    const upload = multer({
      storage,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['.xlsx', '.xls', '.csv'];
        const fileExt = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
        if (!allowedTypes.includes(fileExt)) {
          cb(new Error('Invalid file type. Only Excel (.xlsx, .xls) and CSV files are allowed'), false);
        } else {
          cb(null, true);
        }
      }
    });

    app.use('/api/files', fileRoutes);
  });

  describe('POST /api/files/upload', () => {
    // Happy path tests
    test('successfully uploads and processes Excel file', async () => {
      parseFile.mockImplementation((req, res) => {
        res.status(200).json(mockUploadResponse);
      });

      const response = await request(app)
        .post('/api/files/upload')
        .attach('file', Buffer.from('test'), {
          filename: 'test.xlsx',
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

      expect(response.status).toBe(200);
      expect(response.type).toMatch(/json/);
      expect(response.body).toEqual(mockUploadResponse);
      expect(parseFile).toHaveBeenCalled();
    });

    test('successfully uploads and processes CSV file', async () => {
      parseFile.mockImplementation((req, res) => {
        res.status(200).json(mockUploadResponse);
      });

      const response = await request(app)
        .post('/api/files/upload')
        .attach('file', Buffer.from('name,email\nJohn,john@test.com'), {
          filename: 'test.csv',
          contentType: 'text/csv'
        });

      expect(response.status).toBe(200);
      expect(response.type).toMatch(/json/);
      expect(response.body).toEqual(mockUploadResponse);
      expect(parseFile).toHaveBeenCalled();
    });

    // Edge cases
    test('handles empty CSV file', async () => {
      parseFile.mockImplementation((req, res) => {
        res.status(400).json({ error: 'File is empty or contains no valid data' });
      });

      const response = await request(app)
        .post('/api/files/upload')
        .attach('file', Buffer.from('\n\n'), {
          filename: 'empty.csv',
          contentType: 'text/csv'
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'File is empty or contains no valid data' });
    });

    test('handles CSV file with only headers', async () => {
      parseFile.mockImplementation((req, res) => {
        res.status(400).json({ error: 'File is empty or contains no valid data' });
      });

      const response = await request(app)
        .post('/api/files/upload')
        .attach('file', Buffer.from('name,email\n'), {
          filename: 'headers-only.csv',
          contentType: 'text/csv'
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'File is empty or contains no valid data' });
    });

    test('handles corrupted Excel file', async () => {
      parseFile.mockImplementation((req, res) => {
        res.status(400).json({ error: 'Error parsing file. Please ensure it is a valid Excel/CSV file.' });
      });

      const response = await request(app)
        .post('/api/files/upload')
        .attach('file', Buffer.from('corrupted content'), {
          filename: 'corrupted.xlsx',
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Error parsing file. Please ensure it is a valid Excel/CSV file.' });
    });

    // Failure cases
    test('handles missing file', async () => {
      parseFile.mockImplementation((req, res) => {
        res.status(400).json({ error: 'No file uploaded' });
      });

      const response = await request(app)
        .post('/api/files/upload');

      expect(response.status).toBe(400);
      expect(response.type).toMatch(/json/);
      expect(response.body).toEqual({ error: 'No file uploaded' });
    });

    test('handles file size limit exceeded', async () => {
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
      const response = await request(app)
        .post('/api/files/upload')
        .attach('file', largeBuffer, {
          filename: 'test.xlsx',
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

      expect(response.status).toBe(400);
      expect(response.type).toMatch(/json/);
      expect(response.body).toEqual({ error: 'File size too large. Maximum size is 5MB.' });
    });

    test('handles invalid file type', async () => {
      const response = await request(app)
        .post('/api/files/upload')
        .attach('file', Buffer.from('test'), {
          filename: 'test.txt',
          contentType: 'text/plain'
        });

      expect(response.status).toBe(400);
      expect(response.type).toMatch(/json/);
      expect(response.body).toEqual({ error: 'Invalid file type. Only Excel (.xlsx, .xls) and CSV files are allowed' });
    });

    test('handles incorrect field name for file upload', async () => {
      const response = await request(app)
        .post('/api/files/upload')
        .attach('wrongFieldName', Buffer.from('test'), {
          filename: 'test.xlsx',
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Unexpected field name for file upload. Use "file".' });
    });
  });

  describe('GET /api/files/:fileId', () => {
    // Happy path
    test('retrieves file data successfully', async () => {
      FileData.findById.mockResolvedValueOnce(mockFileData);

      const response = await request(app)
        .get('/api/files/test-file-id');

      expect(response.status).toBe(200);
      expect(response.type).toMatch(/json/);
      expect(response.body).toEqual(mockFileData);
      expect(FileData.findById).toHaveBeenCalledWith('test-file-id');
    });

    // Edge cases
    test('handles file not found', async () => {
      FileData.findById.mockResolvedValueOnce(null);

      const response = await request(app)
        .get('/api/files/nonexistent-id');

      expect(response.status).toBe(404);
      expect(response.type).toMatch(/json/);
      expect(response.body).toEqual({ error: 'File not found' });
    });

    // Failure cases
    test('handles invalid file ID format', async () => {
      FileData.findById.mockRejectedValueOnce(new Error('Invalid ID'));

      const response = await request(app)
        .get('/api/files/invalid-id');

      expect(response.status).toBe(400);
      expect(response.type).toMatch(/json/);
      expect(response.body).toEqual({ error: 'Invalid file ID' });
    });

    test('handles database connection error', async () => {
      FileData.findById.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/files/test-file-id');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Error retrieving file data' });
    });
  });
}); 