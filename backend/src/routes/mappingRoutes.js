const express = require('express');
const router = express.Router();
const mappingController = require('../controllers/mappingController');

// Get mappings for a data category
router.get('/mappings/:dataCategory', mappingController.getMappings);

// Update mappings for a data category
router.patch('/mappings/:dataCategory', mappingController.updateMappings);

// Preview mapped data with transformations
router.post('/mappings/:dataCategory/preview', mappingController.previewMappedData);

// Export mapped data with transformations
router.post('/mappings/:dataCategory/export', mappingController.exportMappedData);

// Generate transformation formula using AI
router.post('/mappings/generate-formula', mappingController.generateTransformationFormula);

// Save user mappings
router.post('/mappings/save', mappingController.saveUserMappings);

// Load user mappings
router.get('/mappings/load/:mappingId', mappingController.loadUserMappings);

// List all user mappings
router.get('/user-mappings', mappingController.listUserMappings);

// Save a mapping template
router.post('/mapping-templates', mappingController.saveTemplate);

// List all mapping templates
router.get('/mapping-templates', mappingController.listTemplates);

// Get a specific mapping template
router.get('/mapping-templates/:templateId', mappingController.getTemplate);

// List all data categories
router.get('/data-categories', mappingController.listDataCategories);

module.exports = router;
