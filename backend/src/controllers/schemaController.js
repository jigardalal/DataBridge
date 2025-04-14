const fs = require('fs').promises;
const path = require('path');

// Path to the schemas directory
const schemasDir = path.join(__dirname, '../schemas');

/**
 * Get schema fields for a specific data category
 */
const getSchemaFields = async (req, res) => {
  try {
    const { dataCategory } = req.params;
    
    if (!dataCategory) {
      return res.status(400).json({ error: 'Data category is required' });
    }
    
    console.log(`Getting schema fields for category: ${dataCategory}`);
    
    // Normalize the data category name for file lookup
    const normalizedCategory = dataCategory.toLowerCase().replace(/\s+/g, '_');
    
    // Try to find the schema file
    let schemaPath = path.join(schemasDir, `${normalizedCategory}.json`);
    
    // Check if the schema file exists
    try {
      await fs.access(schemaPath);
    } catch (error) {
      // If the exact file doesn't exist, try to find a close match
      console.log(`Schema file not found at ${schemaPath}, looking for alternatives`);
      
      try {
        const files = await fs.readdir(schemasDir);
        const matchingFile = files.find(file => 
          file.toLowerCase().includes(normalizedCategory) || 
          normalizedCategory.includes(file.toLowerCase().replace('.json', ''))
        );
        
        if (matchingFile) {
          schemaPath = path.join(schemasDir, matchingFile);
          console.log(`Found alternative schema file: ${matchingFile}`);
        } else {
          // If no schema file exists, return a default set of fields based on the category
          console.log(`No schema file found for category: ${dataCategory}, using default fields`);
          return res.json({
            dataCategory,
            fields: generateDefaultFields(dataCategory)
          });
        }
      } catch (dirError) {
        console.error('Error reading schemas directory:', dirError);
        return res.status(500).json({ error: 'Failed to read schemas directory' });
      }
    }
    
    // Read and parse the schema file
    try {
      const schemaContent = await fs.readFile(schemaPath, 'utf8');
      const schema = JSON.parse(schemaContent);
      
      // Extract fields from the schema
      const fields = schema.fields || [];
      
      console.log(`Returning ${fields.length} fields for category: ${dataCategory}`);
      
      res.json({
        dataCategory,
        fields
      });
    } catch (readError) {
      console.error(`Error reading schema file ${schemaPath}:`, readError);
      return res.status(500).json({ error: 'Failed to read schema file' });
    }
  } catch (error) {
    console.error('Error getting schema fields:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Generate default fields for a data category if no schema file exists
 */
const generateDefaultFields = (dataCategory) => {
  // Create some basic fields based on the data category name
  const words = dataCategory.split(/\s+/);
  const baseFields = [
    { name: 'id', type: 'string', required: true, description: 'Unique identifier' },
    { name: 'name', type: 'string', required: true, description: 'Name' },
    { name: 'description', type: 'string', required: false, description: 'Description' },
    { name: 'created_at', type: 'date', required: false, description: 'Creation date' },
    { name: 'updated_at', type: 'date', required: false, description: 'Last update date' }
  ];
  
  // Add category-specific fields
  const categoryFields = words.map(word => ({
    name: word.toLowerCase() + '_id',
    type: 'string',
    required: false,
    description: `${word} identifier`
  }));
  
  return [...baseFields, ...categoryFields];
};

/**
 * List all available schemas
 */
const listSchemas = async (req, res) => {
  try {
    const files = await fs.readdir(schemasDir);
    const schemas = files
      .filter(file => file.endsWith('.json'))
      .map(file => ({
        name: file.replace('.json', '').replace(/_/g, ' '),
        file
      }));
    
    res.json(schemas);
  } catch (error) {
    console.error('Error listing schemas:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getSchemaFields,
  listSchemas
};
