const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './.env.development' });

const MappingOptions = require('./models/MappingOptions');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/databridge';

const seed = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const categories = [
      "Charge Profile",
      "Trucks",
      "Customers",
      "Order List",
      "Driver Charge Profile",
      "Chassis",
      "Carrier Tariff",
      "Vehicle List",
      "Users",
      "Customer Employee",
      "Driver List",
      "Drivers",
      "Trailers",
      "Product List",
      "Fleet Owner",
      "TestDataForImport.xlsx",
      "Carrier",
      "Customer List",
      "Carrier Charge Profile",
      "Chassis Owner",
      "Load Tariff",
      "Driver Tariff"
    ];

    for (const category of categories) {
      await MappingOptions.findOneAndUpdate(
        { dataCategory: category },
        { fields: [] },
        { upsert: true, new: true }
      );
    }

    console.log('Seeded MappingOptions with data categories');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seed();
