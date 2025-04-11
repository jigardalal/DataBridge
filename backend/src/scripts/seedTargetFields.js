const mongoose = require('mongoose');
const TargetField = require('../models/TargetField');
const path = require('path');
const fs = require('fs');

// Read the target fields data from the JSON file
const targetFieldsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../sample_files/targetfields.json'), 'utf8')
);

async function seedTargetFields() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/databridge');

    console.log('Connected to MongoDB');

    // Drop the entire collection to remove all indexes
    await mongoose.connection.db.dropCollection('targetfields');
    console.log('Dropped existing targetfields collection');

    // Insert new data one by one to handle any potential errors
    let successCount = 0;
    let errorCount = 0;

    for (const doc of targetFieldsData) {
      try {
        await TargetField.create(doc);
        successCount++;
      } catch (error) {
        console.error(`Error inserting document for ${doc.dataCategory}:`, error.message);
        errorCount++;
      }
    }

    console.log(`Seeding completed. Successfully inserted ${successCount} documents, ${errorCount} errors.`);

    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');

  } catch (error) {
    console.error('Error seeding target fields:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedTargetFields(); 