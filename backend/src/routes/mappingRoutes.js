const express = require('express');
const router = express.Router();
const mappingController = require('../controllers/mappingController');

// Get generated mappings with confidence scores
router.get('/mappings/:schemaType', mappingController.getMappings);

// Update mappings with user adjustments
router.patch('/mappings/:schemaType', mappingController.updateMappings);

// Save current mappings as a template
router.post('/mapping-templates', mappingController.saveTemplate);

// List saved mapping templates
router.get('/mapping-templates', mappingController.listTemplates);

// Get a specific saved template
router.get('/mapping-templates/:templateId', mappingController.getTemplate);

module.exports = router;
