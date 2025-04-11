const MappingDictionary = require('../models/MappingDictionary');
const MappingOptions = require('../models/MappingOptions');

module.exports = {
  // GET /api/mappings/:dataCategory
  async getMappings(req, res) {
    const { dataCategory } = req.params;
    const { fileId } = req.query;
    try {
      const MappingAgent = require('../agents/MappingAgent');
      const agent = new MappingAgent();

      // Normalize dataCategory by replacing underscores with spaces
      const normalizedCategory = dataCategory.replace(/_/g, ' ');

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

      const mappingResult = await agent.mapFields(inputFields, normalizedCategory);
      const optionsDoc = await MappingOptions.findOne({ dataCategory: normalizedCategory });
      const dropdownOptions = optionsDoc ? optionsDoc.fields : [];

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
      res.status(500).json({ error: error.message });
    }
  },

  // PATCH /api/mappings/:dataCategory
  async updateMappings(req, res) {
    const { dataCategory } = req.params;
    const { updatedMappings } = req.body;
    res.json({
      dataCategory,
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
  },

  // GET /api/data-categories
  async listDataCategories(req, res) {
    try {
      const dataCategories = await MappingOptions.distinct('dataCategory');
      res.json(dataCategories);
    } catch (error) {
      console.error('Error fetching data categories:', error);
      res.status(500).json({ error: 'Error fetching data categories' });
    }
  }
};
