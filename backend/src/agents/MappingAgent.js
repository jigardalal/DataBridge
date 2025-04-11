const BaseAgent = require('./BaseAgent');
const MappingCache = require('../models/MappingCache');

/**
 * @typedef {Object} FieldMapping
 * @property {string} input_field - Original field name from input
 * @property {string} output_field - Mapped field name in output schema
 * @property {number} confidence - Confidence score for the mapping (0-1)
 * @property {string[]} [variations] - Other possible variations of this field name
 */

/**
 * @typedef {Object} MappingResult
 * @property {FieldMapping[]} mappings - Array of field mappings
 * @property {string[]} unmapped_fields - Fields that couldn't be mapped
 * @property {number} overall_confidence - Overall confidence score for the mapping
 * @property {Object} usage_stats - Statistics about the mapping operation
 */

class MappingAgent extends BaseAgent {
  constructor(config = {}) {
    super({
      ...config,
      model: config.model || 'gpt-4-turbo-preview',
      temperature: config.temperature || 0.2
    });

    // Initialize mapping dictionary with common variations
    this.mappingDictionary = {
      carrier: {
        id: ['Carrier ID', 'CarrierID', 'ID', 'Carrier Number'],
        name: ['Carrier Name', 'Name', 'Company Name'],
        status: ['Status', 'Carrier Status', 'Active Status'],
        contact_name: ['Contact Name', 'Primary Contact', 'Contact Person'],
        contact_email: ['Contact Email', 'Email', 'Email Address'],
        contact_phone: ['Contact Phone', 'Phone', 'Phone Number'],
        address: ['Address', 'Street Address', 'Mailing Address'],
        mc_number: ['MC Number', 'Motor Carrier Number', 'MC#'],
        dot_number: ['DOT Number', 'DOT#', 'Department of Transportation Number']
      },
      carrier_charge_profile: {
        id: ['Profile ID', 'ID', 'Charge Profile ID'],
        name: ['Profile Name', 'Name', 'Charge Profile Name'],
        carrier_id: ['Carrier ID', 'Carrier', 'Carrier Reference'],
        rate_type: ['Rate Type', 'Type', 'Pricing Type'],
        base_rate: ['Base Rate', 'Rate', 'Standard Rate'],
        minimum_charge: ['Minimum Charge', 'Min Charge', 'Base Charge'],
        maximum_charge: ['Maximum Charge', 'Max Charge', 'Cap'],
        effective_date: ['Effective Date', 'Start Date', 'Valid From'],
        expiration_date: ['Expiration Date', 'End Date', 'Valid Until']
      },
      carrier_tariff: {
        id: ['Tariff ID', 'ID', 'Tariff Number'],
        name: ['Tariff Name', 'Name', 'Description'],
        carrier_id: ['Carrier ID', 'Carrier', 'Carrier Reference'],
        rate_type: ['Rate Type', 'Type', 'Pricing Type'],
        origin: ['Origin', 'From', 'Starting Point'],
        destination: ['Destination', 'To', 'End Point'],
        rate: ['Rate', 'Price', 'Cost'],
        effective_date: ['Effective Date', 'Start Date', 'Valid From'],
        expiration_date: ['Expiration Date', 'End Date', 'Valid Until']
      },
      charge_profile: {
        id: ['Profile ID', 'ID', 'Charge Profile ID'],
        name: ['Profile Name', 'Name', 'Charge Profile Name'],
        type: ['Type', 'Profile Type', 'Category'],
        base_rate: ['Base Rate', 'Rate', 'Standard Rate'],
        minimum_charge: ['Minimum Charge', 'Min Charge', 'Base Charge'],
        maximum_charge: ['Maximum Charge', 'Max Charge', 'Cap'],
        effective_date: ['Effective Date', 'Start Date', 'Valid From'],
        expiration_date: ['Expiration Date', 'End Date', 'Valid Until']
      },
      chassis: {
        id: ['Chassis ID', 'ID', 'Chassis Number'],
        owner_id: ['Owner ID', 'Owner', 'Owner Reference'],
        status: ['Status', 'Chassis Status', 'Condition'],
        make: ['Make', 'Manufacturer', 'Brand'],
        model: ['Model', 'Model Number', 'Type'],
        year: ['Year', 'Model Year', 'Manufacturing Year'],
        last_inspection: ['Last Inspection', 'Inspection Date', 'Last Check'],
        next_inspection: ['Next Inspection', 'Due Date', 'Inspection Due']
      },
      chassis_owner: {
        id: ['Owner ID', 'ID', 'Owner Number'],
        name: ['Owner Name', 'Name', 'Company Name'],
        status: ['Status', 'Owner Status', 'Active Status'],
        contact_name: ['Contact Name', 'Primary Contact', 'Contact Person'],
        contact_email: ['Contact Email', 'Email', 'Email Address'],
        contact_phone: ['Contact Phone', 'Phone', 'Phone Number'],
        address: ['Address', 'Street Address', 'Mailing Address']
      },
      customer_employee: {
        id: ['Employee ID', 'ID', 'Employee Number'],
        customer_id: ['Customer ID', 'Customer', 'Customer Reference'],
        name: ['Name', 'Full Name', 'Employee Name'],
        email: ['Email', 'Email Address', 'Contact Email'],
        phone: ['Phone', 'Phone Number', 'Contact Number'],
        role: ['Role', 'Position', 'Job Title'],
        status: ['Status', 'Employee Status', 'Active Status']
      },
      customer_list: {
        id: ['Customer ID', 'ID', 'Customer Number'],
        name: ['Customer Name', 'Name', 'Company Name'],
        status: ['Status', 'Customer Status', 'Active Status'],
        type: ['Type', 'Customer Type', 'Category'],
        contact_name: ['Contact Name', 'Primary Contact', 'Contact Person'],
        contact_email: ['Contact Email', 'Email', 'Email Address'],
        contact_phone: ['Contact Phone', 'Phone', 'Phone Number'],
        address: ['Address', 'Street Address', 'Mailing Address']
      },
      customers: {
        id: ['Customer ID', 'ID', 'Customer Number'],
        name: ['Customer Name', 'Name', 'Company Name'],
        status: ['Status', 'Customer Status', 'Active Status'],
        type: ['Type', 'Customer Type', 'Category'],
        contact_name: ['Contact Name', 'Primary Contact', 'Contact Person'],
        contact_email: ['Contact Email', 'Email', 'Email Address'],
        contact_phone: ['Contact Phone', 'Phone', 'Phone Number'],
        address: ['Address', 'Street Address', 'Mailing Address']
      },
      driver_charge_profile: {
        id: ['Profile ID', 'ID', 'Charge Profile ID'],
        name: ['Profile Name', 'Name', 'Charge Profile Name'],
        driver_id: ['Driver ID', 'Driver', 'Driver Reference'],
        rate_type: ['Rate Type', 'Type', 'Pricing Type'],
        base_rate: ['Base Rate', 'Rate', 'Standard Rate'],
        minimum_charge: ['Minimum Charge', 'Min Charge', 'Base Charge'],
        maximum_charge: ['Maximum Charge', 'Max Charge', 'Cap'],
        effective_date: ['Effective Date', 'Start Date', 'Valid From'],
        expiration_date: ['Expiration Date', 'End Date', 'Valid Until']
      },
      driver_list: {
        id: ['Driver ID', 'ID', 'Driver Number'],
        name: ['Driver Name', 'Name', 'Full Name'],
        status: ['Status', 'Driver Status', 'Active Status'],
        license: ['License Number', 'Driver License', 'License ID'],
        vehicle_type: ['Vehicle Type', 'Vehicle Category', 'Car Type'],
        phone: ['Phone', 'Contact Number', 'Mobile Number'],
        email: ['Email', 'Email Address', 'Contact Email']
      },
      driver_tariff: {
        id: ['Tariff ID', 'ID', 'Tariff Number'],
        name: ['Tariff Name', 'Name', 'Description'],
        driver_id: ['Driver ID', 'Driver', 'Driver Reference'],
        rate_type: ['Rate Type', 'Type', 'Pricing Type'],
        origin: ['Origin', 'From', 'Starting Point'],
        destination: ['Destination', 'To', 'End Point'],
        rate: ['Rate', 'Price', 'Cost'],
        effective_date: ['Effective Date', 'Start Date', 'Valid From'],
        expiration_date: ['Expiration Date', 'End Date', 'Valid Until']
      },
      drivers: {
        id: ['Driver ID', 'ID', 'Driver Number'],
        name: ['Driver Name', 'Name', 'Full Name'],
        status: ['Status', 'Driver Status', 'Active Status'],
        license: ['License Number', 'Driver License', 'License ID'],
        vehicle_type: ['Vehicle Type', 'Vehicle Category', 'Car Type'],
        phone: ['Phone', 'Contact Number', 'Mobile Number'],
        email: ['Email', 'Email Address', 'Contact Email']
      },
      fleet_owner: {
        id: ['Owner ID', 'ID', 'Owner Number'],
        name: ['Owner Name', 'Name', 'Company Name'],
        status: ['Status', 'Owner Status', 'Active Status'],
        contact_name: ['Contact Name', 'Primary Contact', 'Contact Person'],
        contact_email: ['Contact Email', 'Email', 'Email Address'],
        contact_phone: ['Contact Phone', 'Phone', 'Phone Number'],
        address: ['Address', 'Street Address', 'Mailing Address']
      },
      load_tariff: {
        id: ['Tariff ID', 'ID', 'Tariff Number'],
        name: ['Tariff Name', 'Name', 'Description'],
        type: ['Type', 'Tariff Type', 'Category'],
        origin: ['Origin', 'From', 'Starting Point'],
        destination: ['Destination', 'To', 'End Point'],
        rate: ['Rate', 'Price', 'Cost'],
        effective_date: ['Effective Date', 'Start Date', 'Valid From'],
        expiration_date: ['Expiration Date', 'End Date', 'Valid Until']
      },
      order_list: {
        id: ['Order ID', 'ID', 'Order Number'],
        customer_id: ['Customer ID', 'Customer', 'Customer Reference'],
        status: ['Status', 'Order Status', 'State'],
        type: ['Type', 'Order Type', 'Category'],
        pickup_location: ['Pickup Location', 'Origin', 'From'],
        delivery_location: ['Delivery Location', 'Destination', 'To'],
        created_date: ['Created Date', 'Order Date', 'Date Created'],
        scheduled_date: ['Scheduled Date', 'Due Date', 'Scheduled For']
      },
      product_list: {
        id: ['Product ID', 'ID', 'Product Number'],
        name: ['Product Name', 'Name', 'Description'],
        type: ['Type', 'Product Type', 'Category'],
        status: ['Status', 'Product Status', 'Active Status'],
        unit: ['Unit', 'Unit of Measure', 'UOM'],
        price: ['Price', 'Cost', 'Unit Price']
      },
      trailers: {
        id: ['Trailer ID', 'ID', 'Trailer Number'],
        owner_id: ['Owner ID', 'Owner', 'Owner Reference'],
        status: ['Status', 'Trailer Status', 'Condition'],
        make: ['Make', 'Manufacturer', 'Brand'],
        model: ['Model', 'Model Number', 'Type'],
        year: ['Year', 'Model Year', 'Manufacturing Year'],
        last_inspection: ['Last Inspection', 'Inspection Date', 'Last Check'],
        next_inspection: ['Next Inspection', 'Due Date', 'Inspection Due']
      },
      trucks: {
        id: ['Truck ID', 'ID', 'Truck Number'],
        owner_id: ['Owner ID', 'Owner', 'Owner Reference'],
        status: ['Status', 'Truck Status', 'Condition'],
        make: ['Make', 'Manufacturer', 'Brand'],
        model: ['Model', 'Model Number', 'Type'],
        year: ['Year', 'Model Year', 'Manufacturing Year'],
        last_inspection: ['Last Inspection', 'Inspection Date', 'Last Check'],
        next_inspection: ['Next Inspection', 'Due Date', 'Inspection Due']
      },
      users: {
        id: ['User ID', 'ID', 'User Number'],
        name: ['Name', 'Full Name', 'User Name'],
        email: ['Email', 'Email Address', 'Contact Email'],
        role: ['Role', 'User Role', 'Position'],
        status: ['Status', 'User Status', 'Active Status'],
        created_date: ['Created Date', 'Join Date', 'Date Created']
      },
      vehicle_list: {
        id: ['Vehicle ID', 'ID', 'Vehicle Number'],
        type: ['Type', 'Vehicle Type', 'Category'],
        make: ['Make', 'Manufacturer', 'Brand'],
        model: ['Model', 'Model Number', 'Type'],
        year: ['Year', 'Model Year', 'Manufacturing Year'],
        status: ['Status', 'Vehicle Status', 'Condition'],
        owner_id: ['Owner ID', 'Owner', 'Owner Reference']
      }
    };

    // Initialize usage statistics
    this.usageStats = {
      total_calls: 0,
      cache_hits: 0,
      field_stats: {}
    };
  }

  /**
   * Generate a cache key for field mapping
   * @private
   * @param {string[]} inputFields - Array of input field names
   * @param {string} targetSchema - Target schema type (e.g., 'customer', 'driver')
   * @returns {string} Cache key
   */
  _generateMappingCacheKey(inputFields, targetSchema) {
    const sortedFields = [...inputFields].sort().join(',');
    return `${targetSchema}:${sortedFields}`;
  }

  /**
   * Update usage statistics for field mappings
   * @private
   * @param {string} targetSchema - Schema being mapped to
   * @param {FieldMapping[]} mappings - Array of field mappings
   */
  _updateUsageStats(targetSchema, mappings) {    
    if (!this.usageStats.field_stats[targetSchema]) {
      this.usageStats.field_stats[targetSchema] = {};
    }

    mappings.forEach(mapping => {
      if (!this.usageStats.field_stats[targetSchema][mapping.output_field]) {
        this.usageStats.field_stats[targetSchema][mapping.output_field] = {
          total_mappings: 0,
          variations: new Set()
        };
      }

      const stats = this.usageStats.field_stats[targetSchema][mapping.output_field];
      stats.total_mappings++;
      stats.variations.add(mapping.input_field);
    });
  }

  /**
   * Map input fields to target fields using AI
   * @param {string[]} inputFields - Array of input field names from uploaded file
   * @param {Object[]} targetFields - Array of target field objects with name, type, etc.
   * @returns {Promise<Object>} Mapping result with confidence scores
   */
  async mapFields(inputFields, targetFields) {
    if (!inputFields || !inputFields.length) {
      throw new Error('No input fields provided');
    }

    if (!targetFields || !targetFields.length) {
      throw new Error('No target fields provided');
    }

    try {
      // Check cache first
      const cacheKey = {
        dataCategory: targetFields[0]?.dataCategory || 'unknown',
        inputFields: [...inputFields].sort() // Sort to ensure consistent cache key
      };

      const cachedResult = await MappingCache.findOne(cacheKey);
      if (cachedResult) {
        console.log('Using cached mappings');
        return {
          mappings: cachedResult.mappings,
          unmapped_fields: [],
          overall_confidence: this.calculateOverallConfidence(cachedResult.mappings)
        };
      }

      // If not in cache, generate new mappings using LLM
      console.log('Generating new mappings with LLM');
      const systemMessage = {
        role: 'system',
        content: `You are an expert at matching field names between different data schemas. 
Your task is to match input field names to the most appropriate target field names.
For each input field, provide:
1. The best matching target field
2. A confidence score (0-1) indicating how confident you are in the match
3. A brief explanation of why this match was chosen

Consider:
- Semantic meaning of field names
- Common abbreviations and variations
- Field types and data patterns
- Context from surrounding fields`
      };

      const userMessage = {
        role: 'user',
        content: `Match these input fields to the target fields:

Input Fields:
${JSON.stringify(inputFields, null, 2)}

Target Fields:
${JSON.stringify(targetFields, null, 2)}

Provide your response in JSON format with:
{
  "mappings": [
    {
      "input_field": "original field name",
      "output_field": "matched target field",
      "confidence": 0.95,
      "explanation": "why this match was chosen"
    }
  ],
  "unmapped_fields": ["fields that couldn't be matched"],
  "overall_confidence": 0.85
}`
      };

      const response = await this.makeAPICall([systemMessage, userMessage], {
        temperature: 0.2,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.content);

      // Store in cache
      await MappingCache.create({
        ...cacheKey,
        mappings: result.mappings.map(m => ({
          input_field: m.input_field,
          output_field: m.output_field,
          confidence: m.confidence
        }))
      });

      return {
        mappings: result.mappings.map(m => ({
          input_field: m.input_field,
          output_field: m.output_field,
          confidence: m.confidence,
          explanation: m.explanation
        })),
        unmapped_fields: result.unmapped_fields || [],
        overall_confidence: result.overall_confidence || 0
      };
    } catch (error) {
      console.error('Error in mapFields:', error);
      throw error;
    }
  }

  calculateOverallConfidence(mappings) {
    if (!mappings || mappings.length === 0) return 0;
    const totalConfidence = mappings.reduce((sum, m) => sum + m.confidence, 0);
    return totalConfidence / mappings.length;
  }

  /**
   * Get usage statistics for field mappings
   * @returns {Object} Usage statistics
   */
  getUsageStats() {
    return {
      ...this.usageStats,
      cache_hit_rate: this.usageStats.total_calls > 0 
        ? this.usageStats.cache_hits / this.usageStats.total_calls 
        : 0
    };
  }

  /**
   * Add new field variations to the mapping dictionary
   * @param {string} schema - Schema type to update
   * @param {string} field - Field name to update
   * @param {string[]} variations - New variations to add
   */
  addFieldVariations(schema, field, variations) {
    if (!this.mappingDictionary[schema] || !this.mappingDictionary[schema][field]) {
      throw new Error(`Invalid schema or field: ${schema}.${field}`);
    }

    const existingVariations = new Set(this.mappingDictionary[schema][field]);
    variations.forEach(v => existingVariations.add(v));
    this.mappingDictionary[schema][field] = Array.from(existingVariations);
  }

  /**
   * Map input fields to target schema fields
   * @param {Object} inputData - Sample of the input data
   * @param {Object} targetSchema - Schema to map to
   * @returns {Promise<Object>} Mapping suggestions with confidence scores
   */
  async suggestFieldMappings(inputData, targetSchema) {
    const inputHeaders = Object.keys(inputData[0] || {});
    const sampleRows = inputData.slice(0, 3);

    const messages = [
      this.systemPrompt,
      {
        role: 'user',
        content: `Map these input fields to the target schema fields.

Input Headers: ${JSON.stringify(inputHeaders)}
Sample Data: ${JSON.stringify(sampleRows, null, 2)}

Target Schema:
${JSON.stringify(targetSchema, null, 2)}

Provide your response in JSON format with:
1. mappings: Array of objects containing:
   - input_field: Original field name
   - target_field: Suggested schema field
   - confidence: Number between 0-1
   - transformation: Any needed data transformation
2. unmapped_fields: Array of input fields with no clear mapping
3. missing_required: Array of required schema fields not found in input`
      }
    ];

    const response = await this.makeAPICall(messages, {
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.content);
  }

  /**
   * Suggest data transformations for mapped fields
   * @param {Object} mappedField - The mapped field details
   * @param {Array} sampleValues - Sample values from the input
   * @param {Object} targetField - Target schema field definition
   * @returns {Promise<Object>} Transformation suggestions
   */
  async suggestTransformations(mappedField, sampleValues, targetField) {
    const messages = [
      this.systemPrompt,
      {
        role: 'user',
        content: `Suggest data transformations for this field mapping:

Mapped Field: ${JSON.stringify(mappedField)}
Sample Values: ${JSON.stringify(sampleValues)}
Target Field Spec: ${JSON.stringify(targetField)}

Consider:
- Data type conversions
- Format standardization
- Value normalization
- Handling missing/invalid values

Provide your response in JSON format with:
1. transformations: Array of suggested transformations
2. validation_rules: Any validation rules to apply
3. edge_cases: Potential edge cases to handle
4. example_transformed: Sample transformed values`
      }
    ];

    const response = await this.makeAPICall(messages, {
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.content);
  }

  /**
   * Validate and refine existing mappings based on user feedback
   * @param {Object} currentMappings - Current field mappings
   * @param {Object} userFeedback - User feedback and corrections
   * @returns {Promise<Object>} Refined mappings
   */
  async refineMappings(currentMappings, userFeedback) {
    const messages = [
      this.systemPrompt,
      {
        role: 'user',
        content: `Refine these field mappings based on user feedback:

Current Mappings: ${JSON.stringify(currentMappings, null, 2)}
User Feedback: ${JSON.stringify(userFeedback, null, 2)}

Provide your response in JSON format with:
1. updated_mappings: The refined mapping suggestions
2. learning_points: What was learned from the feedback
3. confidence_adjustments: Any changes to confidence scores
4. new_transformation_rules: Any new transformation rules identified`
      }
    ];

    const response = await this.makeAPICall(messages, {
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.content);
  }
}

module.exports = MappingAgent;
