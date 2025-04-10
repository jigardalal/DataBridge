const express = require('express');
const router = express.Router();
const { parseFile, getFileData, listFiles } = require('../controllers/fileController');
const { upload, handleFileUploadError } = require('../middleware/fileValidation');

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

module.exports = router;
