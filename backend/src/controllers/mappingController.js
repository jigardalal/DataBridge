const MappingDictionary = require('../models/MappingDictionary');
const TargetField = require('../models/TargetField');
const MappingAgent = require('../agents/MappingAgent');
const FileData = require('../models/FileData');
const Dataset = require('../models/Dataset');

// Initialize the mapping agent
const mappingAgent = new MappingAgent();

// Helper function to apply transformations
const applyTransformation = (type, logic, row) => {
  // Replace field references in the logic with actual values
  const processedLogic = logic.replace(/{([^}]+)}/g, (match, fieldName) => {
    const value = row[fieldName];
    // Handle string values by adding quotes
    if (typeof value === 'string') {
      return `"${value.replace(/"/g, '\\"')}"`;
    }
    // Return the value as is for numbers, booleans, etc.
    return value !== undefined ? value : 'undefined';
  });
  
  // Execute different types of transformations
  switch (type) {
    case 'concatenate':
      // For concatenation, we can directly evaluate the expression
      return eval(processedLogic);
      
    case 'substring':
      // For substring, we evaluate the expression which should return a string with substring method
      return eval(processedLogic);
      
    case 'arithmetic':
      // For arithmetic operations, we evaluate the expression
      return eval(processedLogic);
      
    case 'conditional':
      // For conditional logic, we evaluate the ternary expression
      return eval(processedLogic);
      
    case 'custom':
      // For custom transformations, we evaluate the custom logic
      return eval(processedLogic);
      
    default:
      throw new Error(`Unknown transformation type: ${type}`);
  }
};

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
      
      console.log('Target fields detail:', JSON.stringify(targetFields, null, 2));

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
            confidenceScore: m.confidence || 1.0,
            transformationType: m.transformation_type || 'none',
            transformationLogic: m.transformation_logic || null
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
  },

  // POST /api/mappings/:dataCategory/preview
  async previewMappedData(req, res) {
    const { dataCategory } = req.params;
    const { fileId, mappings } = req.body;
    
    try {
      // Get file data
      const fileData = await FileData.findById(fileId);
      if (!fileData) {
        return res.status(404).json({ error: 'File data not found' });
      }
      
      // Get target fields
      const normalizedCategory = dataCategory.replace(/_/g, ' ');
      const targetFieldsDoc = await TargetField.findOne({ dataCategory: normalizedCategory });
      if (!targetFieldsDoc) {
        return res.status(404).json({ error: 'Target fields not found' });
      }
      
      // Get all target field names to ensure they're included in output
      const targetFieldNames = targetFieldsDoc.fields.map(field => field.name);
      
      // Apply mappings and transformations to the data
      const mappedData = fileData.data.map(row => {
        // Initialize result with all target fields set to null
        const result = {};
        targetFieldNames.forEach(fieldName => {
          result[fieldName] = null;
        });
        
        // Apply mappings and transformations
        for (const mapping of mappings) {
          if (!mapping.output_field) continue;
          
          // Get the input value
          let value = row[mapping.input_field];
          
          // Apply transformation if specified
          if (mapping.transformation_type && mapping.transformation_type !== 'none' && mapping.transformation_logic) {
            try {
              value = applyTransformation(mapping.transformation_type, mapping.transformation_logic, row);
            } catch (error) {
              console.error(`Error applying transformation for field ${mapping.output_field}:`, error);
            }
          }
          
          result[mapping.output_field] = value;
        }
        
        return result;
      });
      
      // Return all rows for preview
      res.json({
        data: mappedData,
        totalRows: mappedData.length
      });
    } catch (error) {
      console.error('Error generating preview:', error);
      res.status(500).json({ error: error.message });
    }
  },
  
  // POST /api/mappings/:dataCategory/export
  async exportMappedData(req, res) {
    const { dataCategory } = req.params;
    const { fileId, mappings, format = 'csv' } = req.body;
    
    try {
      // Get file data
      const fileData = await FileData.findById(fileId);
      if (!fileData) {
        return res.status(404).json({ error: 'File data not found' });
      }
      
      // Get target fields
      const normalizedCategory = dataCategory.replace(/_/g, ' ');
      const targetFieldsDoc = await TargetField.findOne({ dataCategory: normalizedCategory });
      if (!targetFieldsDoc) {
        return res.status(404).json({ error: 'Target fields not found' });
      }
      
      // Get all target field names to ensure they're included in output
      const targetFieldNames = targetFieldsDoc.fields.map(field => field.name);
      
      // Apply mappings and transformations to the data
      const mappedData = fileData.data.map(row => {
        // Initialize result with all target fields set to null
        const result = {};
        targetFieldNames.forEach(fieldName => {
          result[fieldName] = null;
        });
        
        // Apply mappings and transformations
        for (const mapping of mappings) {
          if (!mapping.output_field) continue;
          
          // Get the input value
          let value = row[mapping.input_field];
          
          // Apply transformation if specified
          if (mapping.transformation_type && mapping.transformation_type !== 'none' && mapping.transformation_logic) {
            try {
              value = applyTransformation(mapping.transformation_type, mapping.transformation_logic, row);
            } catch (error) {
              console.error(`Error applying transformation for field ${mapping.output_field}:`, error);
            }
          }
          
          result[mapping.output_field] = value;
        }
        
        return result;
      });
      
      // For now, just return the JSON data
      // In a real implementation, you would convert to CSV or other formats as needed
      res.json({
        data: mappedData,
        format,
        fileName: `${normalizedCategory}_${new Date().toISOString().split('T')[0]}.${format}`
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Generate transformation formula using AI
  async generateTransformationFormula(req, res) {
    const { description, inputFields, outputField, sampleData } = req.body;
    
    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }
    
    try {
      // Use the mapping agent to generate the formula
      const prompt = `
Generate a JavaScript transformation formula based on this description:
"${description}"

Available input fields: ${JSON.stringify(inputFields)}
Target output field: ${outputField}
Sample data: ${JSON.stringify(sampleData)}

The formula should use the syntax {fieldName} to reference input fields.
For example, to concatenate firstName and lastName: {firstName} + " " + {lastName}

Return ONLY the formula as plain text without any explanation, quotes or code blocks.
      `;
      
      const response = await mappingAgent.makeAPICall([
        { role: 'system', content: 'You are a helpful assistant that generates JavaScript transformation formulas.' },
        { role: 'user', content: prompt }
      ], { temperature: 0.2 });
      
      // Extract the formula from the response
      let formula = response.content.trim();
      
      // Determine the transformation type based on the description and formula
      let transformationType = 'custom';
      if (description.toLowerCase().includes('concat') || formula.includes('+') && formula.includes('{')) {
        transformationType = 'concatenate';
      } else if (description.toLowerCase().includes('substring') || formula.includes('substring')) {
        transformationType = 'substring';
      } else if (description.toLowerCase().includes('multiply') || description.toLowerCase().includes('divide') || 
                description.toLowerCase().includes('add') || description.toLowerCase().includes('subtract') ||
                /[\+\-\*\/]/.test(formula)) {
        transformationType = 'arithmetic';
      } else if (description.toLowerCase().includes('if') || description.toLowerCase().includes('condition') || 
                formula.includes('?')) {
        transformationType = 'conditional';
      }
      
      res.json({
        formula,
        transformationType,
        success: true
      });
    } catch (error) {
      console.error('Error generating transformation formula:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Save user mappings
  async saveUserMappings(req, res) {
    try {
      const { name, description, dataCategory, fileId, mappings, targetFields } = req.body;
      
      if (!fileId || !mappings) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Find the dataset by fileId
      const dataset = await Dataset.findOne({ fileId });
      
      if (!dataset) {
        return res.status(404).json({ error: 'Dataset not found for this file' });
      }
      
      // Update the dataset with the mapping information
      dataset.name = name || dataset.name;
      dataset.description = description || dataset.description;
      dataset.mappings = {
        configurations: mappings,
        targetFields: targetFields,
        lastUpdated: new Date()
      };
      dataset.status = 'completed';
      dataset.updatedAt = new Date();
      
      await dataset.save();
      
      res.json({ 
        success: true, 
        message: 'Mapping saved successfully', 
        dataset
      });
    } catch (error) {
      console.error('Error saving user mappings:', error);
      res.status(500).json({ error: error.message });
    }
  },
  
  // Load user mappings
  async loadUserMappings(req, res) {
    try {
      const { mappingId } = req.params;
      
      // Find the dataset by ID
      const dataset = await Dataset.findById(mappingId);
      
      if (!dataset || !dataset.mappings) {
        return res.status(404).json({ error: 'Mapping not found' });
      }
      
      // Update last used timestamp
      dataset.updatedAt = new Date();
      await dataset.save();
      
      res.json({ 
        success: true, 
        mapping: {
          _id: dataset._id,
          name: dataset.name,
          description: dataset.description,
          mappings: dataset.mappings.configurations,
          targetFields: dataset.mappings.targetFields
        }
      });
    } catch (error) {
      console.error('Error loading user mappings:', error);
      res.status(500).json({ error: error.message });
    }
  },
  
  // List all user mappings
  async listUserMappings(req, res) {
    try {
      const { dataCategory, fileId } = req.query;
      
      let query = { 'mappings': { $exists: true, $ne: null } };
      
      if (fileId) {
        query.fileId = fileId;
      }
      
      // Find datasets that have mappings
      const datasets = await Dataset.find(query)
        .sort({ updatedAt: -1 })
        .select('_id name description fileId createdAt updatedAt');
      
      res.json(datasets);
    } catch (error) {
      console.error('Error listing user mappings:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Export the applyTransformation function for testing
  applyTransformation
};
