const MappingDictionary = require('../models/MappingDictionary');
const TargetField = require('../models/TargetField');
const MappingAgent = require('../agents/MappingAgent');
const FileData = require('../models/FileData');

// Initialize the mapping agent
const mappingAgent = new MappingAgent();

module.exports = {
  // GET /api/mappings/:dataCategory
  async getMappings(req, res) {
    const { dataCategory } = req.params;
    const { fileId, allData } = req.query;
    try {
      console.log('Getting mappings for:', { dataCategory, fileId, allData });
      
      // Normalize dataCategory by replacing underscores with spaces
      const normalizedCategory = dataCategory.replace(/_/g, ' ');

      let inputFields = [];
      let sampleData = [];

      if (fileId) {
        console.log('Fetching file data for fileId:', fileId);
        const fileData = await FileData.findById(fileId);
        console.log('Found file data:', fileData ? 'yes' : 'no');
        
        if (fileData) {
          if (Array.isArray(fileData.columnHeaders)) {
            inputFields = fileData.columnHeaders;
            console.log('Column headers:', inputFields);
          }
          // Get all rows if allData=true is specified, otherwise get first 10 rows
          if (Array.isArray(fileData.data)) {
            console.log('Total rows in file:', fileData.data.length);
            const dataToUse = allData === 'true' ? fileData.data : fileData.data.slice(0, 10);
            sampleData = dataToUse.map(row => {
              // Ensure each row has all columns, even if some are empty
              const formattedRow = {};
              inputFields.forEach(header => {
                formattedRow[header] = row[header] !== undefined ? row[header] : '';
              });
              return formattedRow;
            });
            console.log('Data rows being returned:', sampleData.length);
            console.log('First row:', sampleData[0]);
          }
        } else {
          console.warn('FileData not found for fileId:', fileId);
        }
      }

      // Get target fields from TargetField collection
      console.log('Fetching target fields for category:', normalizedCategory);
      const targetFieldsDoc = await TargetField.findOne({ dataCategory: normalizedCategory });
      console.log('Found target fields:', targetFieldsDoc ? 'yes' : 'no');
      
      const targetFields = targetFieldsDoc ? targetFieldsDoc.fields.map(f => ({
        name: f.name,
        type: f.type,
        required: f.required,
        description: f.description
      })) : [];

      if (!inputFields.length || !targetFields.length) {
        console.log('No input fields or target fields found');
        return res.json({
          inputFields,
          targetFields,
          mappings: [],
          dropdownOptions: targetFields.map(f => f.name),
          sampleData: []
        });
      }

      // Generate mappings using the MappingAgent
      console.log('Generating mappings...');
      const mappingResult = await mappingAgent.mapFields(inputFields, targetFields);
      
      const response = {
        inputFields,
        targetFields,
        mappings: mappingResult.mappings,
        dropdownOptions: targetFields.map(f => f.name),
        unmappedFields: mappingResult.unmapped_fields,
        overallConfidence: mappingResult.overall_confidence,
        sampleData
      };
      
      console.log('Sending response with sample data rows:', response.sampleData.length);
      res.json(response);
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
