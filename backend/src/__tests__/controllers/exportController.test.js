const { exportData, getAvailableFields } = require('../../controllers/exportController');
const ProcessedData = require('../../models/ProcessedData');

// Mock ProcessedData model
jest.mock('../../models/ProcessedData', () => ({
  find: jest.fn(),
  findOne: jest.fn()
}));

describe('Export Controller', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
      send: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('exportData', () => {
    const sampleData = [
      {
        entityType: 'customer',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890'
      },
      {
        entityType: 'customer',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '098-765-4321'
      }
    ];

    test('exports data as CSV with specified fields', async () => {
      mockReq.body = {
        entityType: 'customer',
        fields: ['name', 'email']
      };

      ProcessedData.find.mockResolvedValue(sampleData);

      await exportData(mockReq, mockRes);

      expect(ProcessedData.find).toHaveBeenCalledWith({ entityType: 'customer' });
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('customer_export_')
      );
      expect(mockRes.send).toHaveBeenCalled();
    });

    test('handles filtered exports', async () => {
      mockReq.body = {
        entityType: 'customer',
        filter: { name: 'John Doe' },
        fields: ['name', 'email']
      };

      ProcessedData.find.mockResolvedValue(sampleData);

      await exportData(mockReq, mockRes);

      expect(ProcessedData.find).toHaveBeenCalledWith({
        entityType: 'customer',
        name: 'John Doe'
      });
      expect(mockRes.send).toHaveBeenCalled();
    });

    test('returns 400 for missing entity type', async () => {
      await exportData(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Entity type is required'
      });
    });

    test('returns 404 when no data found', async () => {
      mockReq.body = {
        entityType: 'customer'
      };

      ProcessedData.find.mockResolvedValue([]);

      await exportData(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'No data found for export'
      });
    });
  });

  describe('getAvailableFields', () => {
    const sampleDocument = {
      entityType: 'customer',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '123-456-7890',
      address: '123 Main St'
    };

    test('returns available fields for entity type', async () => {
      mockReq.params = { entityType: 'customer' };
      ProcessedData.findOne.mockResolvedValue(sampleDocument);

      await getAvailableFields(mockReq, mockRes);

      expect(ProcessedData.findOne).toHaveBeenCalledWith({ entityType: 'customer' });
      expect(mockRes.json).toHaveBeenCalledWith({
        fields: expect.arrayContaining(['name', 'email', 'phone', 'address'])
      });
    });

    test('returns 400 for missing entity type', async () => {
      await getAvailableFields(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Entity type is required'
      });
    });

    test('returns 404 when no data found', async () => {
      mockReq.params = { entityType: 'customer' };
      ProcessedData.findOne.mockResolvedValue(null);

      await getAvailableFields(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'No data found for entity type'
      });
    });
  });
}); 