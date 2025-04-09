const BaseAgent = require('./BaseAgent');

class MappingAgent extends BaseAgent {
  constructor(config = {}) {
    super(config);
    this.systemPrompt = this.formatSystemMessage('data field mapping');
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