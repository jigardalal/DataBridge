const BaseAgent = require('./BaseAgent');

/**
 * @typedef {Object} ClassificationResult
 * @property {string} classified_type - The identified content type (e.g., 'customers', 'drivers')
 * @property {number} confidence_score - Confidence level between 0 and 1
 * @property {string} reasoning - Explanation of the classification decision
 * @property {string[]} suggested_mappings - Array of key fields supporting the classification
 */

/**
 * @typedef {Object} SubCategoryResult
 * @property {string[]} sub_categories - Array of identified sub-categories
 * @property {string[]} special_cases - Array of special cases or edge cases
 * @property {number} confidence - Confidence score between 0 and 1
 */

class ClassificationAgent extends BaseAgent {
  constructor(config = {}) {
    super({
      ...config,
      model: config.model || 'gpt-4-turbo-preview',
      temperature: config.temperature || 0.3
    });
  }

  /**
   * Validate classification result against schema
   * @private
   * @param {Object} result - The result to validate
   * @returns {ClassificationResult}
   */
  _validateClassificationResult(result) {
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid classification result format');
    }

    const requiredFields = ['classified_type', 'confidence_score', 'reasoning'];
    for (const field of requiredFields) {
      if (!(field in result)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (typeof result.confidence_score !== 'number' || 
        result.confidence_score < 0 || 
        result.confidence_score > 1) {
      throw new Error('confidence_score must be a number between 0 and 1');
    }

    if (!Array.isArray(result.suggested_mappings)) {
      result.suggested_mappings = [];
    }

    return result;
  }

  /**
   * Validate sub-category result against schema
   * @private
   * @param {Object} result - The result to validate
   * @returns {SubCategoryResult}
   */
  _validateSubCategoryResult(result) {
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid sub-category result format');
    }

    const requiredFields = ['sub_categories', 'special_cases', 'confidence'];
    for (const field of requiredFields) {
      if (!(field in result)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (!Array.isArray(result.sub_categories)) {
      throw new Error('sub_categories must be an array');
    }

    if (!Array.isArray(result.special_cases)) {
      throw new Error('special_cases must be an array');
    }

    if (typeof result.confidence !== 'number' || 
        result.confidence < 0 || 
        result.confidence > 1) {
      throw new Error('confidence must be a number between 0 and 1');
    }

    return result;
  }

  /**
   * Classify the content of an Excel tab based on its headers and sample data
   * @param {Array<Object>} data - Array of objects representing rows from the tab
   * @param {Array<string>} [possibleTypes] - Optional list of possible content types to consider
   * @returns {Promise<ClassificationResult>} Classification result with type, confidence, and reasoning
   */
  async classifyTabContent(data, possibleTypes = null) {
    if (!data || data.length === 0) {
      throw new Error('No data provided for classification');
    }

    const headers = Object.keys(data[0]);
    const sampleRows = data.slice(0, 5); // Use first 5 rows for context

    const systemMessage = this.formatSystemMessage('data classification');
    const userMessage = {
      role: 'user',
      content: JSON.stringify({
        headers,
        sample_data: sampleRows,
        possible_types: possibleTypes || [
          'customers',
          'drivers',
          'vehicles',
          'orders',
          'products',
          'employees',
          'locations',
          'transactions',
          'inventory',
          'suppliers'
        ]
      })
    };

    const response = await this.makeAPICall(
      [systemMessage, userMessage],
      {
        response_format: { type: 'json_object' },
        temperature: 0.3
      }
    );

    try {
      const result = JSON.parse(response.content);
      return this._validateClassificationResult(result);
    } catch (error) {
      throw new Error('Failed to parse or validate classification response');
    }
  }

  /**
   * Identify sub-categories within a classified tab
   * @param {Array<Object>} data - Array of objects representing rows from the tab
   * @param {string} mainType - The main classification type
   * @returns {Promise<SubCategoryResult>} Sub-categories and special cases
   */
  async identifySubCategories(data, mainType) {
    if (!data || data.length === 0) {
      throw new Error('No data provided for sub-category identification');
    }

    const systemMessage = this.formatSystemMessage('sub-category identification');
    const userMessage = {
      role: 'user',
      content: JSON.stringify({
        main_type: mainType,
        sample_data: data.slice(0, 10), // Use first 10 rows for context
        fields: Object.keys(data[0])
      })
    };

    const response = await this.makeAPICall(
      [systemMessage, userMessage],
      {
        response_format: { type: 'json_object' },
        temperature: 0.4
      }
    );

    try {
      const result = JSON.parse(response.content);
      return this._validateSubCategoryResult(result);
    } catch (error) {
      throw new Error('Failed to parse or validate sub-category response');
    }
  }
}

module.exports = ClassificationAgent; 