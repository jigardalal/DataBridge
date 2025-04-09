const errorHandler = require('../../middleware/errorHandler');

// Mock console.error to avoid noise in test output
console.error = jest.fn();

describe('Error Handler Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    process.env.NODE_ENV = 'test';
    jest.clearAllMocks();
  });

  test('handles error with status code and message', () => {
    const error = new Error('Test error');
    error.statusCode = 400;
    
    errorHandler(error, req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Test error',
      stack: undefined
    });
    expect(console.error).toHaveBeenCalledWith(error.stack);
  });

  test('uses default 500 status code when not provided', () => {
    const error = new Error('Server error');
    
    errorHandler(error, req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Server error',
      stack: undefined
    });
  });

  test('uses default error message when not provided', () => {
    const error = new Error();
    error.statusCode = 400;
    
    errorHandler(error, req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Internal Server Error',
      stack: undefined
    });
  });

  test('includes stack trace in development environment', () => {
    process.env.NODE_ENV = 'development';
    const error = new Error('Dev error');
    error.stack = 'Test stack trace';
    
    errorHandler(error, req, res, next);
    
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Dev error',
      stack: 'Test stack trace'
    });
  });

  test('omits stack trace in production environment', () => {
    process.env.NODE_ENV = 'production';
    const error = new Error('Prod error');
    error.stack = 'Test stack trace';
    
    errorHandler(error, req, res, next);
    
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Prod error',
      stack: undefined
    });
  });
}); 