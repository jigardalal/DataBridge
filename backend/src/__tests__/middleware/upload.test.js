const multer = require('multer');

jest.mock('multer');

describe('Upload Middleware', () => {
  let upload;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup multer mock
    const multerInstance = {
      single: jest.fn()
    };
    multer.mockReturnValue(multerInstance);
    multer.memoryStorage = jest.fn().mockReturnValue({});
    
    // Import the module fresh for each test
    jest.isolateModules(() => {
      upload = require('../../middleware/upload');
    });
  });

  test('should configure multer with memory storage', () => {
    expect(multer.memoryStorage).toHaveBeenCalled();
  });

  test('should configure multer with correct options', () => {
    expect(multer).toHaveBeenCalledWith({
      storage: expect.any(Object),
      limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
      },
      fileFilter: expect.any(Function)
    });
  });

  describe('file filtering', () => {
    let config;
    let cb;

    beforeEach(() => {
      config = multer.mock.calls[0][0];
      cb = jest.fn();
    });

    test('should allow CSV files', () => {
      const file = { mimetype: 'text/csv' };
      config.fileFilter({}, file, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    test('should allow Excel files', () => {
      const xlsxFile = { mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
      config.fileFilter({}, xlsxFile, cb);
      expect(cb).toHaveBeenCalledWith(null, true);

      const xlsFile = { mimetype: 'application/vnd.ms-excel' };
      config.fileFilter({}, xlsFile, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    test('should handle files without mimetype', () => {
      const file = {};
      config.fileFilter({}, file, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });
  });

  describe('middleware configuration', () => {
    test('should export a configured multer middleware', () => {
      expect(upload).toBeDefined();
      expect(upload.single).toBeDefined();
      expect(typeof upload.single).toBe('function');
    });

    test('should use memory storage', () => {
      const storage = multer.memoryStorage();
      expect(multer).toHaveBeenCalledWith(expect.objectContaining({ storage }));
    });

    test('should set correct file size limit', () => {
      const tenMB = 10 * 1024 * 1024;
      expect(multer).toHaveBeenCalledWith(
        expect.objectContaining({
          limits: expect.objectContaining({
            fileSize: tenMB
          })
        })
      );
    });
  });
}); 