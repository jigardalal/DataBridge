const BaseAgent = require('./BaseAgent');

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
      customer: {
        id: ['Customer ID', 'CustomerID', 'Client ID', 'CustID', 'Customer Number'],
        name: ['Customer Name', 'Client Name', 'Full Name', 'Name'],
        email: ['Email', 'Email Address', 'Contact Email', 'E-mail'],
        phone: ['Phone', 'Phone Number', 'Contact Number', 'Telephone'],
        address: ['Address', 'Street Address', 'Mailing Address', 'Location'],
        status: ['Status', 'Customer Status', 'Client Status', 'State'],
        join_date: ['Join Date', 'Registration Date', 'Start Date', 'Member Since']
      },
      driver: {
        id: ['Driver ID', 'DriverID', 'Driver Number', 'ID'],
        name: ['Driver Name', 'Name', 'Full Name'],
        license: ['License Number', 'Driver License', 'License ID', 'DL Number'],
        vehicle_type: ['Vehicle Type', 'Vehicle Category', 'Car Type'],
        status: ['Status', 'Driver Status', 'Active Status'],
        phone: ['Phone', 'Contact Number', 'Mobile Number'],
        join_date: ['Join Date', 'Start Date', 'Registration Date']
      },
      vehicle: {
        id: ['Vehicle ID', 'VehicleID', 'Car ID', 'Fleet Number'],
        make: ['Make', 'Manufacturer', 'Brand'],
        model: ['Model', 'Vehicle Model', 'Car Model'],
        year: ['Year', 'Model Year', 'Manufacturing Year'],
        status: ['Status', 'Vehicle Status', 'Condition'],
        license_plate: ['License Plate', 'Plate Number', 'Registration Number'],
        last_service: ['Last Service Date', 'Service Date', 'Maintenance Date']
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
   * Map input fields to target schema fields
   * @param {string[]} inputFields - Array of input field names
   * @param {string} targetSchema - Target schema type (e.g., 'customer', 'driver')
   * @param {Object} [options] - Additional options for mapping
   * @returns {Promise<MappingResult>} Mapping result with confidence scores
   */
  async mapFields(inputFields, targetSchema, options = {}) {
    if (!inputFields || !inputFields.length) {
      throw new Error('No input fields provided');
    }

    if (!this.mappingDictionary[targetSchema]) {
      throw new Error(`Unknown schema type: ${targetSchema}`);
    }

    // FAST MODE: skip LLM call, use dictionary heuristic
    if (process.env.FAST_MAPPING === 'true') {
      const mappings = [];
      const unmapped_fields = [];

      inputFields.forEach(input => {
        let matched = false;
        for (const [key, variations] of Object.entries(this.mappingDictionary[targetSchema])) {
          if (variations.map(v => v.toLowerCase()).includes(input.toLowerCase())) {
            mappings.push({
              input_field: input,
              output_field: key,
              confidence: 0.9
            });
            matched = true;
            break;
          }
        }
        if (!matched) {
          unmapped_fields.push(input);
        }
      });

      return {
        mappings,
        unmapped_fields,
        overall_confidence: mappings.length / inputFields.length,
        usage_stats: {
          timestamp: Date.now(),
          model_used: 'fast-mode',
          token_usage: 0
        }
      };
    }

    this.usageStats.total_calls++;
    const cacheKey = this._generateMappingCacheKey(inputFields, targetSchema);
    const cachedResult = this.getCachedResponse(cacheKey);
    
    if (cachedResult) {
      this.usageStats.cache_hits++;
      return cachedResult;
    }

    const systemMessage = this.formatSystemMessage('field mapping');
    const userMessage = {
      role: 'user',
      content:
        "Respond ONLY in JSON format with the following structure:\n" +
        `{
  "mappings": [
    {
      "input_field": "...",
      "output_field": "...",
      "confidence": 0.95
    }
  ],
  "unmapped_fields": ["..."],
  "overall_confidence": 0.9
}\n` +
        JSON.stringify({
          input_fields: inputFields,
          target_schema: targetSchema,
          mapping_dictionary: this.mappingDictionary[targetSchema],
          options
        })
    };

    const response = await this.makeAPICall(
      [systemMessage, userMessage],
      {
        response_format: { type: 'json_object' },
        temperature: 0.2
      }
    );

    try {
      console.log('Raw OpenAI response content:', response.content);
      const result = JSON.parse(response.content);
      const mappingResult = {
        mappings: result.mappings.map(m => ({
          input_field: m.input_field,
          output_field: m.output_field,
          confidence: m.confidence,
          variations: m.variations || []
        })),
        unmapped_fields: result.unmapped_fields || [],
        overall_confidence: result.overall_confidence,
        usage_stats: {
          timestamp: Date.now(),
          model_used: response.model,
          token_usage: response.usage
        }
      };

      this._updateUsageStats(targetSchema, mappingResult.mappings);
      this.cacheResponse(cacheKey, mappingResult);

      return mappingResult;
    } catch (error) {
      console.error('Failed to parse mapping response:', response.content);
      throw new Error('Failed to parse mapping response');
    }
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
