const express = require('express');
const router = express.Router();
const { parseFile, getFileData, listFiles } = require('../controllers/fileController');
const { upload, handleFileUploadError } = require('../middleware/fileValidation');
const FileData = require('../models/FileData'); // Import the FileData model

// Route for file upload and parsing
router.post('/upload', 
  upload.single('file'),
  handleFileUploadError,
  parseFile
);

// Route for retrieving all uploaded files
router.get('/', listFiles);

// Route for retrieving parsed file data
router.get('/:fileId', getFileData);

// Get sample data from a file
router.get('/:fileId/sample', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { limit = 10 } = req.query;
    
    console.log(`Fetching sample data for fileId: ${fileId}`);
    
    // Find the file data by ID
    const fileData = await FileData.findById(fileId);
    
    if (!fileData) {
      console.log(`File not found with ID: ${fileId}`);
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Check if data array exists and has content
    if (!fileData.data || !Array.isArray(fileData.data) || fileData.data.length === 0) {
      console.log(`No data found in file with ID: ${fileId}`);
      return res.json({
        success: true,
        sampleData: [],
        columnHeaders: fileData.columnHeaders || []
      });
    }
    
    // Get the sample data (limited number of rows)
    const sampleData = fileData.data.slice(0, parseInt(limit, 10));
    
    // Format the sample data to ensure all columns are present
    const formattedSampleData = sampleData.map(row => {
      const formattedRow = {};
      fileData.columnHeaders.forEach(header => {
        formattedRow[header] = row[header] !== undefined ? row[header] : '';
      });
      return formattedRow;
    });
    
    console.log(`Successfully retrieved ${formattedSampleData.length} sample rows`);
    
    res.json({
      success: true,
      sampleData: formattedSampleData,
      columnHeaders: fileData.columnHeaders || []
    });
  } catch (error) {
    console.error('Error fetching sample data:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
