const mongoose = require('mongoose');
const Dataset = require('./models/Dataset');
const MappingDictionary = require('./models/MappingDictionary');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/databridge';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await Dataset.deleteMany({});
  await MappingDictionary.deleteMany({});

  // Seed datasets
  await Dataset.insertMany([
    {
      name: 'Sample Customer Dataset',
      description: 'Test dataset for customers',
      fileUrl: '/files/sample_customer.csv',
      mappings: {
        customer_name: 'CustomerName',
        customer_id: 'CustomerID'
      },
      status: 'completed'
    },
    {
      name: 'Sample Driver Dataset',
      description: 'Test dataset for drivers',
      fileUrl: '/files/sample_driver.csv',
      mappings: {
        driver_name: 'DriverName',
        driver_id: 'DriverID'
      },
      status: 'completed'
    }
  ]);

  // Seed mapping templates
  await MappingDictionary.insertMany([
    {
      name: 'Customer Mapping Template',
      mappings: [
        { inputField: 'customer_name', outputField: 'CustomerName' },
        { inputField: 'customer_id', outputField: 'CustomerID' }
      ],
      usageCount: 0
    },
    {
      name: 'Driver Mapping Template',
      mappings: [
        { inputField: 'driver_name', outputField: 'DriverName' },
        { inputField: 'driver_id', outputField: 'DriverID' }
      ],
      usageCount: 0
    }
  ]);

  console.log('Seeding complete');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
