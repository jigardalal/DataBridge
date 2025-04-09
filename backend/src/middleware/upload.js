const multer = require('multer');

// Configure multer for memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Add file type validation if needed
    cb(null, true); // Allow all files for now
  }
});

module.exports = upload;
