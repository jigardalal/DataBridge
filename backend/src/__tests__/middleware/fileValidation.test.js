const multer = require('multer');
const { upload, handleFileUploadError } = require('../../middleware/fileValidation');
const mockConsole = require('../helpers/consoleMock');

// Mock multer
jest.mock('multer', () => {
  const multerMock = jest.fn().mockReturnValue({
    single: jest.fn().mockReturnValue((req, res, next) => next())
  });
  multerMock.memoryStorage = jest.fn().mockReturnValue({});
  multerMock.MulterError = jest.fn().mockImplementation((code) => ({
    name: 'MulterError',
    code,
    message: 'Multer error'
  }));
  return multerMock;
});

describe('File Validation Middleware', () => {
  let req, res, next;
  const consoleSpy = mockConsole();

  beforeEach(() => {
    req = {
      file: {
        originalname: 'test.xlsx',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 1024
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe('upload', () => {
    it('should configure multer with correct options', () => {
      expect(multer).toHaveBeenCalledWith(expect.objectContaining({
        storage: expect.any(Object),
        fileFilter: expect.any(Function),
        limits: expect.objectContaining({
          fileSize: 5 * 1024 * 1024 // 5MB
        })
      }));
    });

    describe('file filter', () => {
      let fileFilter;

      beforeEach(() => {
        fileFilter = multer.mock.calls[0][0].fileFilter;
      });

      it('should accept valid Excel (.xlsx) file', () => {
        fileFilter(req, req.file, (err, result) => {
          expect(err).toBeNull();
          expect(result).toBe(true);
        });
        expect(consoleSpy.log).toHaveBeenCalledWith('File type accepted:', req.file.mimetype);
      });

      it('should accept valid Excel (.xls) file', () => {
        req.file.originalname = 'test.xls';
        req.file.mimetype = 'application/vnd.ms-excel';
        fileFilter(req, req.file, (err, result) => {
          expect(err).toBeNull();
          expect(result).toBe(true);
        });
        expect(consoleSpy.log).toHaveBeenCalledWith('File type accepted:', req.file.mimetype);
      });

      it('should accept valid CSV file', () => {
        req.file.originalname = 'test.csv';
        req.file.mimetype = 'text/csv';
        fileFilter(req, req.file, (err, result) => {
          expect(err).toBeNull();
          expect(result).toBe(true);
        });
        expect(consoleSpy.log).toHaveBeenCalledWith('File type accepted:', req.file.mimetype);
      });

      it('should reject file with invalid extension', () => {
        req.file.originalname = 'test.txt';
        fileFilter(req, req.file, (err, result) => {
          expect(err).toBeTruthy();
          expect(err.message).toBe('Invalid file type. Only Excel (.xlsx, .xls) and CSV files are allowed');
          expect(result).toBe(false);
        });
        expect(consoleSpy.error).toHaveBeenCalledWith('Invalid file extension:', 'txt');
      });

      it('should reject file with invalid mime type', () => {
        req.file.mimetype = 'text/plain';
        fileFilter(req, req.file, (err, result) => {
          expect(err).toBeTruthy();
          expect(err.message).toBe('Invalid file type. Only Excel (.xlsx, .xls) and CSV files are allowed');
          expect(result).toBe(false);
        });
        expect(consoleSpy.error).toHaveBeenCalledWith('Invalid mime type:', 'text/plain');
      });

      it('should reject file with application/octet-stream mime type', () => {
        req.file.mimetype = 'application/octet-stream';
        fileFilter(req, req.file, (err, result) => {
          expect(err).toBeTruthy();
          expect(err.message).toBe('Invalid file type. Only Excel (.xlsx, .xls) and CSV files are allowed');
          expect(result).toBe(false);
        });
        expect(consoleSpy.error).toHaveBeenCalledWith('Invalid mime type:', 'application/octet-stream');
      });
    });
  });

  describe('handleFileUploadError', () => {
    it('should handle file size limit exceeded error', () => {
      const error = new multer.MulterError('LIMIT_FILE_SIZE');
      handleFileUploadError(error, req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'File size too large. Maximum size is 5MB.'
      });
      expect(consoleSpy.error).toHaveBeenCalledWith('File upload error:', error);
    });

    it('should handle general multer errors', () => {
      const error = new multer.MulterError('GENERAL_ERROR');
      handleFileUploadError(error, req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: `Upload error: ${error.message}`
      });
      expect(consoleSpy.error).toHaveBeenCalledWith('File upload error:', error);
    });

    it('should handle non-multer errors', () => {
      const error = new Error('Generic error');
      handleFileUploadError(error, req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: error.message
      });
      expect(consoleSpy.error).toHaveBeenCalledWith('File upload error:', error);
    });

    it('should call next if no error', () => {
      handleFileUploadError(null, req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(consoleSpy.error).not.toHaveBeenCalled();
    });
  });
}); 