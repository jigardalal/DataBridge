const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './.env.development' });

const MappingOptions = require('./models/MappingOptions');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/databridge';

const seed = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const customerFields = [
      'Customer ID',
      'Customer Name',
      'Email Address',
      'Phone Number',
      'Street Address',
      'Customer Status',
      'Registration Date'
    ];

    await MappingOptions.findOneAndUpdate(
      { schemaType: 'customer' },
      { fields: customerFields },
      { upsert: true, new: true }
    );

    console.log('Seeded MappingOptions for customer');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seed();
