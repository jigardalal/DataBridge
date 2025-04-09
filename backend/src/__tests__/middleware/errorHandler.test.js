const errorHandler = require('../../middleware/errorHandler');

describe('Error Handler Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  let mockError;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    mockError = new Error('Test error');
    
    // Mock console.error to avoid cluttering test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should handle errors with status code', () => {
    mockError.statusCode = 400;
    errorHandler(mockError, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Test error',
      stack: undefined
    });
  });

  test('should default to 500 status code', () => {
    errorHandler(mockError, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Test error',
      stack: undefined
    });
  });

  test('should include stack trace in development environment', () => {
    process.env.NODE_ENV = 'development';
    errorHandler(mockError, mockReq, mockRes, mockNext);

    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Test error',
      stack: mockError.stack
    });
  });

  test('should exclude stack trace in production environment', () => {
    process.env.NODE_ENV = 'production';
    errorHandler(mockError, mockReq, mockRes, mockNext);

    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Test error',
      stack: undefined
    });
  });

  test('should handle errors without message', () => {
    mockError.message = '';
    errorHandler(mockError, mockReq, mockRes, mockNext);

    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Internal Server Error',
      stack: undefined
    });
  });

  test('should log error stack', () => {
    errorHandler(mockError, mockReq, mockRes, mockNext);
    expect(console.error).toHaveBeenCalledWith(mockError.stack);
  });
}); 