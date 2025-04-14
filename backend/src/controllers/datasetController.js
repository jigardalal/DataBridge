const Dataset = require('../models/Dataset');

module.exports = {
  async listDatasets(req, res) {
    try {
      const { dataCategory, fileId } = req.query;
      
      let query = {};
      
      if (dataCategory) {
        query.dataCategory = dataCategory;
      }
      
      if (fileId) {
        query.fileId = fileId;
      }
      
      console.log('Listing datasets with query:', query);
      
      const datasets = await Dataset.find(query)
        .sort({ updatedAt: -1 })
        .select('_id name description fileId fileName dataCategory status createdAt updatedAt');
      
      console.log(`Found ${datasets.length} datasets`);
      
      res.json(datasets);
    } catch (error) {
      console.error('Error listing datasets:', error);
      res.status(500).json({ error: error.message });
    }
  },
  
  async saveDataset(req, res) {
    try {
      const { 
        name, 
        description, 
        dataCategory, 
        fileId, 
        fileName, 
        mappings, 
        targetFields,
        status 
      } = req.body;
      
      if (!fileId) {
        return res.status(400).json({ error: 'Missing required field: fileId' });
      }
      
      console.log('Saving dataset with params:', {
        name,
        description,
        dataCategory,
        fileId,
        fileName,
        mappingsCount: mappings ? mappings.length : 0,
        targetFieldsCount: targetFields ? targetFields.length : 0,
        status
      });
      
      // Find the dataset by fileId
      let dataset = await Dataset.findOne({ fileId });
      
      if (!dataset) {
        // If dataset doesn't exist, create a new one
        dataset = new Dataset({
          name: name || `Dataset for ${fileName || fileId}`,
          description: description || '',
          fileUrl: fileId, // Using fileUrl as fileId for compatibility
          fileId: fileId,
          fileName: fileName || '',
          dataCategory: dataCategory || '',
          status: status || 'completed'
        });
      } else {
        // Update existing dataset
        if (name) dataset.name = name;
        if (description) dataset.description = description;
        if (fileName) dataset.fileName = fileName;
        if (dataCategory) dataset.dataCategory = dataCategory;
        if (status) dataset.status = status;
      }
      
      // Store mappings directly in the dataset
      if (mappings && mappings.length > 0) {
        dataset.mappings = mappings;
      }
      
      // Store target fields directly in the dataset
      if (targetFields && targetFields.length > 0) {
        dataset.targetFields = targetFields;
      }
      
      dataset.updatedAt = new Date();
      
      await dataset.save();
      
      console.log('Dataset saved successfully:', {
        id: dataset._id,
        name: dataset.name,
        dataCategory: dataset.dataCategory,
        fileId: dataset.fileId
      });
      
      res.json({ 
        success: true, 
        message: 'Dataset saved successfully', 
        dataset
      });
    } catch (error) {
      console.error('Error saving dataset:', error);
      res.status(500).json({ error: error.message });
    }
  },
  
  async loadDataset(req, res) {
    try {
      const { mappingId } = req.params;
      
      console.log('Loading dataset with ID:', mappingId);
      
      // Find the dataset by ID
      const dataset = await Dataset.findById(mappingId);
      
      if (!dataset) {
        return res.status(404).json({ error: 'Dataset not found' });
      }
      
      console.log('Found dataset:', {
        id: dataset._id,
        name: dataset.name,
        dataCategory: dataset.dataCategory,
        fileId: dataset.fileId,
        mappingsType: typeof dataset.mappings,
        hasTargetFields: !!dataset.targetFields
      });
      
      // Update last used timestamp
      dataset.updatedAt = new Date();
      
      try {
        await dataset.save();
      } catch (saveError) {
        console.warn('Error updating dataset timestamp:', saveError);
        // Continue even if save fails - this is not critical
      }
      
      // Extract mappings and target fields
      let mappingsArray = [];
      let targetFieldsArray = [];
      
      // Handle different ways mappings might be stored
      if (Array.isArray(dataset.mappings)) {
        // If mappings is already an array, use it directly
        mappingsArray = dataset.mappings;
      } else if (dataset.mappings && typeof dataset.mappings === 'object') {
        // If mappings is an object with configurations, use that
        if (Array.isArray(dataset.mappings.configurations)) {
          mappingsArray = dataset.mappings.configurations;
        } else {
          // Otherwise, convert the object to an array if possible
          mappingsArray = Object.values(dataset.mappings).filter(item => 
            item && typeof item === 'object' && 'input_field' in item && 'output_field' in item
          );
        }
      }
      
      // Handle different ways target fields might be stored
      if (Array.isArray(dataset.targetFields)) {
        // If targetFields is already an array, use it directly
        targetFieldsArray = dataset.targetFields;
      } else if (dataset.mappings && Array.isArray(dataset.mappings.targetFields)) {
        // If targetFields is inside mappings, use that
        targetFieldsArray = dataset.mappings.targetFields;
      }
      
      console.log('Processed dataset:', {
        mappingsCount: mappingsArray.length,
        targetFieldsCount: targetFieldsArray.length,
        dataCategory: dataset.dataCategory
      });
      
      res.json({ 
        success: true, 
        dataset: {
          _id: dataset._id,
          name: dataset.name || '',
          description: dataset.description || '',
          mappings: mappingsArray,
          targetFields: targetFieldsArray,
          dataCategory: dataset.dataCategory || '',
          fileName: dataset.fileName || '',
          fileId: dataset.fileId || dataset.fileUrl || ''
        }
      });
    } catch (error) {
      console.error('Error loading dataset:', error);
      res.status(500).json({ error: error.message });
    }
  }
};
