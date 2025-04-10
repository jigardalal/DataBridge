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

  const ext = path.extname(file.originalname).toLowerCase();
  console.log('FileFilter received:', file.mimetype, ext);

  // Allowed file types
  const allowedTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/octet-stream',
    'application/zip'
  ];
  
  // Check mime type and file extension together
  const allowedExtensions = ['.xlsx', '.xls', '.csv'];
  
  if (!allowedTypes.includes(file.mimetype) || !allowedExtensions.includes(ext)) {
    console.log('Invalid file type:', { mimetype: file.mimetype, extension: ext });
    return cb(new Error('Invalid file type. Only Excel (.xlsx, .xls) and CSV files are allowed'), false);
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
