const MappingDictionary = require('../models/MappingDictionary');
const TargetField = require('../models/TargetField');
const MappingAgent = require('../agents/MappingAgent');

module.exports = {
  // GET /api/mappings/:dataCategory
  async getMappings(req, res) {
    const { dataCategory } = req.params;
    const { fileId } = req.query;
    try {
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

      // Get target fields from TargetField collection
      const targetFieldsDoc = await TargetField.findOne({ dataCategory: normalizedCategory });
      const targetFields = targetFieldsDoc ? targetFieldsDoc.fields.map(f => ({
        name: f.name,
        type: f.type,
        required: f.required,
        description: f.description
      })) : [];

      res.json({
        inputFields,
        targetFields,
        mappings: [] // Start with empty mappings, user will create them
      });
    } catch (error) {
      console.error('Error getting mappings:', error);
      res.status(500).json({ 
        error: error.message,
        details: 'Failed to get field mappings. Please check the data category and try again.'
      });
    }
  },

  // PATCH /api/mappings/:dataCategory
  async updateMappings(req, res) {
    const { dataCategory } = req.params;
    const { mappings, templateName } = req.body;
    
    try {
      // Save the mapping as a template if a name is provided
      if (templateName) {
        const template = new MappingDictionary({
          name: templateName,
          mappings: mappings.map(m => ({
            inputField: m.input_field,
            outputField: m.output_field,
            confidenceScore: m.confidence || 1.0
          }))
        });
        await template.save();
      }

      res.json({
        success: true,
        message: templateName ? 'Mapping template saved successfully' : 'Mappings updated successfully'
      });
    } catch (error) {
      console.error('Error saving mappings:', error);
      res.status(500).json({ error: error.message });
    }
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
      const dataCategories = await TargetField.distinct('dataCategory');
      res.json(dataCategories);
    } catch (error) {
      console.error('Error fetching data categories:', error);
      res.status(500).json({ error: 'Error fetching data categories' });
    }
  }
};
