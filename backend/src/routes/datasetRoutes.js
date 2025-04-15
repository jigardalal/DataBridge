const express = require('express');
const router = express.Router();
const datasetController = require('../controllers/datasetController');

// List all datasets
router.get('/datasets', datasetController.listDatasets);

// Save dataset with mappings
router.post('/datasets/save', datasetController.saveDataset);

// Update an existing dataset
router.put('/datasets/:id', datasetController.updateDataset);

// Load dataset with mappings
router.get('/datasets/load/:mappingId', datasetController.loadDataset);

module.exports = router;
