const XLSX = require('xlsx');
const { parseFile, getFileData } = require('../../controllers/fileController');

// Mock XLSX module
jest.mock('xlsx', () => ({
  read: jest.fn(),
  utils: {
    sheet_to_json: jest.fn()
  }
}));

// Mock FileData model
jest.mock('../../models/FileData');

describe('File Controller', () => {
  let mockReq;
  let mockRes;
  
  const mockData = {
    _id: 'mockFileId123',
    fileName: 'test.xlsx',
    fileType: 'xlsx',
    data: [{ col1: 'data1', col2: 'data2' }],
    columnHeaders: ['col1', 'col2'],
    rowCount: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockReq = {
      file: {
        buffer: Buffer.from('test'),
        originalname: 'test.xlsx',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 1024
      }
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Mock FileData constructor and instance methods
    const MockFileData = function(data) {
      Object.assign(this, {
        _id: 'mockFileId123',
        ...data
      });
      this.save = jest.fn().mockResolvedValue(this);
    };
    MockFileData.findById = jest.fn();
    require('../../models/FileData').mockImplementation(MockFileData);
  });

  describe('parseFile', () => {
    beforeEach(() => {
      XLSX.read.mockReturnValue({ SheetNames: ['Sheet1'], Sheets: { Sheet1: {} } });
      XLSX.utils.sheet_to_json.mockReturnValue([['col1', 'col2'], ['data1', 'data2']]);
    });

    it('should successfully process and save Excel file', async () => {
      await parseFile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'File uploaded and processed successfully',
        fileId: 'mockFileId123',
        rowCount: 1,
        headers: ['col1', 'col2'],
        totalRowsBeforeFiltering: 2,
        blankRowsRemoved: 0
      });
    });

    it('should handle missing file', async () => {
      mockReq.file = null;
      await parseFile(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'No file uploaded' });
    });

    it('should handle empty file', async () => {
      XLSX.utils.sheet_to_json.mockReturnValue([]);
      await parseFile(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'File is empty or contains no valid data' });
    });

    it('should handle file parsing error', async () => {
      XLSX.read.mockImplementation(() => {
        throw new Error('Parse error');
      });
      
      await parseFile(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Error parsing file. Please ensure it is a valid Excel/CSV file.' });
    });

    it('should handle database error', async () => {
      const MockFileData = require('../../models/FileData');
      MockFileData.mockImplementation(function(data) {
        Object.assign(this, data);
        this.save = jest.fn().mockRejectedValue(new Error('Database error'));
      });

      await parseFile(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Error processing file' });
    });
  });

  describe('getFileData', () => {
    it('should successfully retrieve file data', async () => {
      require('../../models/FileData').findById.mockResolvedValue(mockData);
      
      mockReq.params = { fileId: 'mockFileId123' };
      await getFileData(mockReq, mockRes);
      
      expect(mockRes.json).toHaveBeenCalledWith(mockData);
    });

    it('should handle file not found', async () => {
      require('../../models/FileData').findById.mockResolvedValue(null);
      
      mockReq.params = { fileId: 'nonexistentId' };
      await getFileData(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'File not found' });
    });

    it('should handle database error', async () => {
      require('../../models/FileData').findById.mockRejectedValue(new Error('Database error'));
      
      mockReq.params = { fileId: 'mockFileId123' };
      await getFileData(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Error retrieving file data' });
    });
  });
}); 