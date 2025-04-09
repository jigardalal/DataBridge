const BaseAgent = require('./BaseAgent');

/**
 * @typedef {Object} ValidationError
 * @property {string} field - Field name where error occurred
 * @property {string} type - Type of validation error
 * @property {string} message - Error message
 * @property {number} severity - Error severity (1-3)
 * @property {string} [suggestion] - Suggested fix
 */

/**
 * @typedef {Object} ValidationResult
 * @property {ValidationError[]} errors - Array of validation errors
 * @property {Object} stats - Validation statistics
 * @property {number} overall_confidence - Overall confidence in validation
 */

class ValidationAgent extends BaseAgent {
  constructor(config = {}) {
    super({
      ...config,
      model: config.model || 'gpt-4-turbo-preview',
      temperature: config.temperature || 0.2
    });

    // Initialize validation patterns
    this.validationPatterns = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      phone: /^\+?[\d\s-()]{10,}$/,
      date: /^\d{4}-\d{2}-\d{2}$/,
      zipcode: /^\d{5}(-\d{4})?$/,
      ssn: /^\d{3}-\d{2}-\d{4}$/
    };

    // Initialize validation rules
    this.validationRules = {
      customer: {
        required: ['id', 'name', 'email'],
        formats: {
          email: 'email',
          phone: 'phone',
          join_date: 'date',
          zipcode: 'zipcode'
        },
        unique: ['id', 'email']
      },
      driver: {
        required: ['id', 'name', 'license_number'],
        formats: {
          phone: 'phone',
          license_number: /^[A-Z0-9]{6,}$/,
          join_date: 'date'
        },
        unique: ['id', 'license_number']
      },
      vehicle: {
        required: ['id', 'make', 'model', 'year'],
        formats: {
          year: /^\d{4}$/,
          license_plate: /^[A-Z0-9-]{4,}$/,
          last_service: 'date'
        },
        unique: ['id', 'license_plate']
      }
    };
  }

  /**
   * Validate data against schema rules
   * @param {Object[]} data - Array of data objects to validate
   * @param {string} schemaType - Type of schema to validate against
   * @returns {Promise<ValidationResult>} Validation results
   */
  async validateData(data, schemaType) {
    if (!data || !data.length) {
      throw new Error('No data provided for validation');
    }

    if (!this.validationRules[schemaType]) {
      throw new Error(`Unknown schema type: ${schemaType}`);
    }

    const rules = this.validationRules[schemaType];
    const errors = [];
    const stats = {
      total_records: data.length,
      error_count: 0,
      field_errors: {},
      severity_counts: { 1: 0, 2: 0, 3: 0 }
    };

    // Check required fields
    for (const record of data) {
      for (const field of rules.required) {
        if (!record[field]) {
          errors.push({
            field,
            type: 'missing_required',
            message: `Required field '${field}' is missing`,
            severity: 3
          });
          stats.error_count++;
          stats.severity_counts[3]++;
          stats.field_errors[field] = (stats.field_errors[field] || 0) + 1;
        }
      }
    }

    // Validate formats
    for (const record of data) {
      for (const [field, pattern] of Object.entries(rules.formats)) {
        if (record[field]) {
          const regex = typeof pattern === 'string' 
            ? this.validationPatterns[pattern] 
            : pattern;
          
          if (!regex.test(record[field])) {
            errors.push({
              field,
              type: 'invalid_format',
              message: `Field '${field}' has invalid format`,
              severity: 2,
              suggestion: `Expected format: ${pattern}`
            });
            stats.error_count++;
            stats.severity_counts[2]++;
            stats.field_errors[field] = (stats.field_errors[field] || 0) + 1;
          }
        }
      }
    }

    // Check for duplicates
    if (rules.unique) {
      const seen = new Map();
      for (const field of rules.unique) {
        seen.set(field, new Set());
      }

      for (const record of data) {
        for (const field of rules.unique) {
          if (record[field]) {
            if (seen.get(field).has(record[field])) {
              errors.push({
                field,
                type: 'duplicate_value',
                message: `Duplicate value found for field '${field}'`,
                severity: 2
              });
              stats.error_count++;
              stats.severity_counts[2]++;
              stats.field_errors[field] = (stats.field_errors[field] || 0) + 1;
            }
            seen.get(field).add(record[field]);
          }
        }
      }
    }

    // Use AI to detect inconsistencies
    const aiErrors = await this._detectInconsistencies(data, schemaType);
    errors.push(...aiErrors);
    stats.error_count += aiErrors.length;

    return {
      errors,
      stats,
      overall_confidence: this._calculateConfidence(stats)
    };
  }

  /**
   * Use AI to detect data inconsistencies
   * @private
   * @param {Object[]} data - Data to analyze
   * @param {string} schemaType - Schema type
   * @returns {Promise<ValidationError[]>} Detected inconsistencies
   */
  async _detectInconsistencies(data, schemaType) {
    const systemMessage = this.formatSystemMessage('data validation');
    const userMessage = {
      role: 'user',
      content: JSON.stringify({
        data,
        schema_type: schemaType,
        validation_rules: this.validationRules[schemaType]
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
      const result = JSON.parse(response.content);
      return result.inconsistencies || [];
    } catch (error) {
      console.error('Failed to parse inconsistency detection response:', error);
      return [];
    }
  }

  /**
   * Calculate overall validation confidence
   * @private
   * @param {Object} stats - Validation statistics
   * @returns {number} Confidence score (0-1)
   */
  _calculateConfidence(stats) {
    if (stats.total_records === 0) return 0;
    
    const errorRate = stats.error_count / (stats.total_records * Object.keys(this.validationRules).length);
    const severityWeight = (stats.severity_counts[3] * 0.5 + stats.severity_counts[2] * 0.3 + stats.severity_counts[1] * 0.2) / stats.error_count;
    
    return Math.max(0, 1 - (errorRate * severityWeight));
  }

  /**
   * Suggest fixes for validation errors
   * @param {ValidationError[]} errors - Array of validation errors
   * @returns {Promise<Object>} Suggested fixes
   */
  async suggestFixes(errors) {
    const systemMessage = this.formatSystemMessage('error correction');
    const userMessage = {
      role: 'user',
      content: JSON.stringify({
        errors,
        validation_patterns: this.validationPatterns
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
      return JSON.parse(response.content);
    } catch (error) {
      console.error('Failed to parse fix suggestions:', error);
      return { fixes: [] };
    }
  }

  /**
   * Validate a single field value
   * @param {string} field - Field name
   * @param {any} value - Field value
   * @param {string} schemaType - Schema type
   * @returns {ValidationError[]} Validation errors
   */
  validateField(field, value, schemaType) {
    const rules = this.validationRules[schemaType];
    const errors = [];

    // Check if field is required
    if (rules.required.includes(field) && !value) {
      errors.push({
        field,
        type: 'missing_required',
        message: `Required field '${field}' is missing`,
        severity: 3
      });
    }

    // Validate format if specified
    if (rules.formats[field] && value) {
      const pattern = typeof rules.formats[field] === 'string' 
        ? this.validationPatterns[rules.formats[field]] 
        : rules.formats[field];
      
      if (!pattern.test(value)) {
        errors.push({
          field,
          type: 'invalid_format',
          message: `Field '${field}' has invalid format`,
          severity: 2,
          suggestion: `Expected format: ${rules.formats[field]}`
        });
      }
    }

    return errors;
  }
}

module.exports = ValidationAgent; 