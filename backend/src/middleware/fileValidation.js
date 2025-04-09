const multer = require('multer');
const path = require('path');

// Configure multer for file upload
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  console.log('Received file:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });

  // Allowed file types
  const allowedTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/octet-stream' // Sometimes Excel files are sent with this type
  ];
  
  // Check mime type
  if (!allowedTypes.includes(file.mimetype)) {
    console.log('Invalid mime type:', file.mimetype);
    return cb(new Error('Invalid file type. Only .xlsx files are allowed'), false);
  }

  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (!['.xlsx', '.xls', '.csv'].includes(ext)) {
    console.log('Invalid file extension:', ext);
    return cb(new Error('Invalid file type. Only .xlsx files are allowed'), false);
  }

  console.log('File validation passed');
  cb(null, true);
};

// Configure multer upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Error handling middleware
const handleFileUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('File upload error:', err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  
  if (err) {
    console.error('File upload error:', err);
    return res.status(400).json({ error: err.message });
  }
  
  next();
};

module.exports = {
  upload,
  handleFileUploadError
}; 