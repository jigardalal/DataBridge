const express = require('express');
const router = express.Router();
const mappingController = require('../controllers/mappingController');

// Get generated mappings with confidence scores
router.get('/mappings/:dataCategory', mappingController.getMappings);

// Update mappings with user adjustments
router.patch('/mappings/:dataCategory', mappingController.updateMappings);

// Save current mappings as a template
router.post('/mapping-templates', mappingController.saveTemplate);

// List saved mapping templates
router.get('/mapping-templates', mappingController.listTemplates);

// Get a specific saved template
router.get('/mapping-templates/:templateId', mappingController.getTemplate);

// List available data categories
router.get('/data-categories', mappingController.listDataCategories);

module.exports = router;
