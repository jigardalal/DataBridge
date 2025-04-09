const express = require('express');
const router = express.Router();
const { parseFile, getFileData } = require('../controllers/fileController');
const { upload, handleFileUploadError } = require('../middleware/fileValidation');

// Route for file upload and parsing
router.post('/upload', 
  upload.single('file'),
  handleFileUploadError,
  parseFile
);

// Route for retrieving parsed file data
router.get('/:fileId', getFileData);

module.exports = router;