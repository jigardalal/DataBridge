const mongoose = require('mongoose');
const Dataset = require('../../models/Dataset');

describe('Dataset Model Test', () => {
  beforeAll(async () => {
    await mongoose.connect(global.__MONGO_URI__ || 'mongodb://localhost:27017/test-db');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await Dataset.deleteMany({});
  });

  it('should create & save a dataset successfully', async () => {
    const validDataset = {
      name: 'Test Dataset',
      description: 'Test Description',
      fileUrl: 'https://example.com/file.xlsx'
    };

    const dataset = new Dataset(validDataset);
    const savedDataset = await dataset.save();
    
    expect(savedDataset._id).toBeDefined();
    expect(savedDataset.name).toBe(validDataset.name);
    expect(savedDataset.description).toBe(validDataset.description);
    expect(savedDataset.fileUrl).toBe(validDataset.fileUrl);
    expect(savedDataset.status).toBe('pending');
    expect(savedDataset.createdAt).toBeDefined();
    expect(savedDataset.updatedAt).toBeDefined();
  });

  it('should fail to save dataset without required fields', async () => {
    const datasetWithoutRequired = new Dataset({
      description: 'Test Description'
    });

    let err;
    try {
      await datasetWithoutRequired.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.name).toBeDefined();
    expect(err.errors.fileUrl).toBeDefined();
  });

  it('should validate status enum values', async () => {
    const dataset = new Dataset({
      name: 'Test Dataset',
      fileUrl: 'https://example.com/file.xlsx',
      status: 'invalid-status'
    });

    let err;
    try {
      await dataset.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.status).toBeDefined();
  });
}); 