const express = require('express');
const router = express.Router();
const datasetController = require('../controllers/datasetController');

// List all datasets
router.get('/datasets', datasetController.listDatasets);

module.exports = router;
