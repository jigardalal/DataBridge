const BaseAgent = require('./BaseAgent');

class ClassificationAgent extends BaseAgent {
  constructor(config = {}) {
    super(config);
    this.systemPrompt = this.formatSystemMessage('data classification');
  }

  /**
   * Validate input data
   * @private
   */
  _validateData(data) {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Input data must be a non-empty array');
    }
    if (!data[0] || typeof data[0] !== 'object') {
      throw new Error('Input data must contain valid objects');
    }
  }

  /**
   * Classify the content type of a spreadsheet tab
   * @param {Object} tabData - The data from the spreadsheet tab
   * @param {string[]} possibleTypes - Array of possible content types
   * @returns {Promise<Object>} Classification result with confidence score
   */
  async classifyTabContent(tabData, possibleTypes = ['customers', 'drivers', 'rates']) {
    this._validateData(tabData);

    const headers = Object.keys(tabData[0] || {});
    const sampleRows = tabData.slice(0, 5);

    const messages = [
      this.systemPrompt,
      {
        role: 'user',
        content: `Analyze this spreadsheet tab and determine its content type from these options: ${possibleTypes.join(', ')}.
        
Headers: ${JSON.stringify(headers)}
Sample rows: ${JSON.stringify(sampleRows, null, 2)}

Provide your response in JSON format with:
1. classified_type: The identified content type
2. confidence_score: A number between 0 and 1
3. reasoning: Brief explanation of your classification
4. suggested_mappings: Key header fields that support this classification`
      }
    ];

    const response = await this.makeAPICall(messages, {
      temperature: 0.3, // Lower temperature for more consistent classifications
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.content);
  }

  /**
   * Identify potential sub-categories or special cases within a content type
   * @param {Object} tabData - The data from the spreadsheet tab
   * @param {string} mainType - The main content type already identified
   * @returns {Promise<Object>} Sub-classification details
   */
  async identifySubCategories(tabData, mainType) {
    this._validateData(tabData);

    const headers = Object.keys(tabData[0] || {});
    const sampleRows = tabData.slice(0, 3);

    const messages = [
      this.systemPrompt,
      {
        role: 'user',
        content: `For this ${mainType} data, identify any specific sub-categories or special cases.

Headers: ${JSON.stringify(headers)}
Sample rows: ${JSON.stringify(sampleRows, null, 2)}

Look for patterns that might indicate:
- Special customer types (VIP, corporate, individual)
- Driver categories (full-time, contractor)
- Rate structures (fixed, variable, zone-based)

Provide your response in JSON format with:
1. sub_categories: Array of identified sub-categories
2. special_cases: Any edge cases or special handling needed
3. confidence: Confidence score for sub-categorization`
      }
    ];

    const response = await this.makeAPICall(messages, {
      temperature: 0.4,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.content);
  }
}

module.exports = ClassificationAgent; 