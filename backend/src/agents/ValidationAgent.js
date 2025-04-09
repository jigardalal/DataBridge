const BaseAgent = require('./BaseAgent');

class ValidationAgent extends BaseAgent {
  constructor(config = {}) {
    super(config);
    this.systemPrompt = this.formatSystemMessage('data validation and anomaly detection');
  }

  /**
   * Detect anomalies in the mapped data
   * @param {Object} mappedData - The data after field mapping
   * @param {Object} schema - The target schema with validation rules
   * @returns {Promise<Object>} Detected anomalies and validation issues
   */
  async detectAnomalies(mappedData, schema) {
    const sampleSize = Math.min(mappedData.length, 10);
    const sampleData = mappedData.slice(0, sampleSize);

    const messages = [
      this.systemPrompt,
      {
        role: 'user',
        content: `Analyze this mapped data for anomalies and validation issues:

Sample Data: ${JSON.stringify(sampleData, null, 2)}
Schema: ${JSON.stringify(schema, null, 2)}

Look for:
- Data type mismatches
- Format inconsistencies
- Out-of-range values
- Missing required fields
- Duplicate entries
- Statistical outliers

Provide your response in JSON format with:
1. anomalies: Array of detected anomalies with:
   - field: Affected field
   - type: Type of anomaly
   - severity: High/Medium/Low
   - affected_rows: Array of row indices
   - suggestion: Recommended fix
2. validation_failures: Array of schema validation failures
3. data_quality_score: Overall quality score (0-1)
4. recommendations: Suggested improvements`
      }
    ];

    const response = await this.makeAPICall(messages, {
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.content);
  }

  /**
   * Suggest fixes for detected anomalies
   * @param {Object} anomalies - The detected anomalies
   * @param {Object} data - The original data
   * @returns {Promise<Object>} Suggested fixes and transformations
   */
  async suggestFixes(anomalies, data) {
    const messages = [
      this.systemPrompt,
      {
        role: 'user',
        content: `Suggest fixes for these data anomalies:

Anomalies: ${JSON.stringify(anomalies, null, 2)}
Sample Data: ${JSON.stringify(data.slice(0, 3), null, 2)}

For each anomaly, provide:
- Automated fix suggestion
- Manual review recommendation if needed
- Prevention strategies for future data

Provide your response in JSON format with:
1. fixes: Array of suggested fixes with:
   - anomaly_id: Reference to original anomaly
   - fix_type: Automatic/Manual/Hybrid
   - transformation: Suggested data transformation
   - confidence: Confidence in the fix
2. required_user_input: Any needed user input
3. prevention_rules: Rules to prevent similar issues`
      }
    ];

    const response = await this.makeAPICall(messages, {
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.content);
  }

  /**
   * Perform statistical analysis to identify outliers
   * @param {Object} data - The dataset to analyze
   * @param {Array} numericalFields - Fields to check for outliers
   * @returns {Promise<Object>} Statistical analysis results
   */
  async analyzeOutliers(data, numericalFields) {
    const messages = [
      this.systemPrompt,
      {
        role: 'user',
        content: `Perform statistical analysis to identify outliers:

Data Sample: ${JSON.stringify(data.slice(0, 10), null, 2)}
Fields to Analyze: ${JSON.stringify(numericalFields)}

Consider:
- Z-score analysis
- IQR method
- Domain-specific thresholds
- Seasonal patterns if applicable

Provide your response in JSON format with:
1. outliers: Array of identified outliers per field
2. statistics: Basic statistical measures
3. thresholds: Calculated threshold values
4. visualization_suggestions: Recommended plots
5. confidence: Confidence in outlier classification`
      }
    ];

    const response = await this.makeAPICall(messages, {
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.content);
  }
}

module.exports = ValidationAgent; 