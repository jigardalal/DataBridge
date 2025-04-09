const { handleFileUploadError } = require('../../middleware/fileValidation');
const multer = require('multer');
const mockConsole = require('../helpers/consoleMock');

describe('File Validation Middleware', () => {
  let mockReq;
  let mockRes;
  let nextFunction;
  const consoleSpy = mockConsole();

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    nextFunction = jest.fn();
  });

  it('should handle multer file size error', () => {
    const err = new multer.MulterError('LIMIT_FILE_SIZE');
    
    handleFileUploadError(err, mockReq, mockRes, nextFunction);
    
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'File size too large. Maximum size is 5MB.'
    });
    expect(consoleSpy.error).toHaveBeenCalledWith('File upload error:', err);
  });

  it('should handle other multer errors', () => {
    const err = new multer.MulterError('SOME_OTHER_ERROR');
    err.message = 'Test error message';
    
    handleFileUploadError(err, mockReq, mockRes, nextFunction);
    
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Upload error: Test error message'
    });
    expect(consoleSpy.error).toHaveBeenCalledWith('File upload error:', err);
  });

  it('should handle non-multer errors', () => {
    const err = new Error('Custom error message');
    
    handleFileUploadError(err, mockReq, mockRes, nextFunction);
    
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Custom error message'
    });
    expect(consoleSpy.error).toHaveBeenCalledWith('File upload error:', err);
  });

  it('should call next if no error', () => {
    handleFileUploadError(null, mockReq, mockRes, nextFunction);
    
    expect(nextFunction).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
    expect(consoleSpy.error).not.toHaveBeenCalled();
  });
}); 