const MappingDictionary = require('../models/MappingDictionary');
const MappingOptions = require('../models/MappingOptions');
// const MappingAgent = require('../agents/MappingAgent'); // Uncomment when integrating

module.exports = {
  // GET /api/mappings/:schemaType
  async getMappings(req, res) {
    const { schemaType } = req.params;
    const { fileId } = req.query;
    try {
      const MappingAgent = require('../agents/MappingAgent');
      const agent = new MappingAgent();

      let inputFields = [];

      if (fileId) {
        const FileData = require('../models/FileData');
        const fileData = await FileData.findById(fileId);
        if (fileData && Array.isArray(fileData.columnHeaders)) {
          inputFields = fileData.columnHeaders;
        } else {
          console.warn('FileData not found or missing headers for fileId:', fileId);
        }
      }

      // fallback if no fileId or no headers found
      if (inputFields.length === 0) {
        inputFields = [
          'Customer ID',
          'Customer Name',
          'Email Address',
          'Phone Number',
          'Street Address',
          'Customer Status',
          'Registration Date'
        ];
      }

      const mappingResult = await agent.mapFields(inputFields, schemaType);
      const optionsDoc = await MappingOptions.findOne({ schemaType });
      const dropdownOptions = optionsDoc ? optionsDoc.fields : [];

      // Map schema keys to labels for dropdown pre-selection
      const schemaKeyToLabel = {
        id: 'Customer ID',
        name: 'Customer Name',
        email: 'Email Address',
        phone: 'Phone Number',
        address: 'Street Address',
        status: 'Customer Status',
        join_date: 'Registration Date'
      };

      const mappings = (mappingResult.mappings || []).map(m => ({
        input_field: m.input_field,
        output_field: schemaKeyToLabel[m.output_field] || '',
        confidence: m.confidence
      }));

      res.json({
        inputFields,
        dropdownOptions,
        mappings
      });
    } catch (error) {
      console.error('Error generating mappings:', error);
      console.error(error.stack);
      res.status(500).json({ error: error.message, stack: error.stack });
    }
  },

  // PATCH /api/mappings/:schemaType
  async updateMappings(req, res) {
    const { schemaType } = req.params;
    const { updatedMappings } = req.body;
    // TODO: Update mappings based on user adjustments
    res.json({
      schemaType,
      updatedMappings,
      message: 'Stub: update mappings with user adjustments'
    });
  },

  // POST /api/mapping-templates
  async saveTemplate(req, res) {
    const { name, mappings } = req.body;
    try {
      const template = new MappingDictionary({ name, mappings, usageCount: 0 });
      await template.save();
      res.status(201).json(template);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // GET /api/mapping-templates
  async listTemplates(req, res) {
    try {
      const templates = await MappingDictionary.find();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // GET /api/mapping-templates/:templateId
  async getTemplate(req, res) {
    try {
      const template = await MappingDictionary.findById(req.params.templateId);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};
