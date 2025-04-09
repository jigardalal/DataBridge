const express = require('express');
const upload = require('../middleware/upload');
const { uploadFile } = require('../controllers/fileController');

const router = express.Router();

router.post('/upload', upload.single('file'), uploadFile);

module.exports = router;