const ValidationAgent = require('../../agents/ValidationAgent');

// Mock the BaseAgent class
jest.mock('../../agents/BaseAgent', () => {
  return class MockBaseAgent {
    constructor() {
      this.makeAPICall = jest.fn();
      this.formatSystemMessage = jest.fn().mockImplementation((role) => ({
        role: 'system',
        content: `You are an AI assistant specialized in ${role}. Provide clear, accurate, and detailed responses based on the input provided.`
      }));
    }
  };
});

describe('ValidationAgent', () => {
  let agent;
  let mockMakeAPICall;

  beforeEach(() => {
    jest.clearAllMocks();
    agent = new ValidationAgent();
    mockMakeAPICall = jest.fn();
    agent.makeAPICall = mockMakeAPICall;
  });

  describe('detectAnomalies', () => {
    const mappedData = [
      { name: 'John Doe', email: 'john@example.com', age: 25 },
      { name: 'Jane Smith', email: 'invalid-email', age: -5 },
      { name: 'John Doe', email: 'john2@example.com', age: 1000 }
    ];

    const schema = {
      name: { type: 'string', required: true },
      email: { type: 'string', format: 'email', required: true },
      age: { type: 'number', min: 0, max: 120 }
    };

    test('detects various types of anomalies', async () => {
      const mockResponse = {
        content: JSON.stringify({
          anomalies: [
            {
              field: 'email',
              type: 'format_invalid',
              severity: 'High',
              affected_rows: [1],
              suggestion: 'Validate email format'
            },
            {
              field: 'age',
              type: 'out_of_range',
              severity: 'Medium',
              affected_rows: [1, 2],
              suggestion: 'Check age values'
            },
            {
              field: 'name',
              type: 'duplicate',
              severity: 'Low',
              affected_rows: [0, 2],
              suggestion: 'Review duplicate names'
            }
          ],
          validation_failures: ['invalid_email_format', 'age_out_of_range'],
          data_quality_score: 0.7,
          recommendations: ['Implement email validation', 'Add age range checks']
        })
      };

      mockMakeAPICall.mockResolvedValue(mockResponse);

      const result = await agent.detectAnomalies(mappedData, schema);

      expect(result.anomalies).toHaveLength(3);
      expect(result.data_quality_score).toBe(0.7);
      expect(mockMakeAPICall).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('email')
          })
        ]),
        expect.objectContaining({
          temperature: 0.2,
          response_format: { type: 'json_object' }
        })
      );
    });

    test('handles empty dataset', async () => {
      const mockResponse = {
        content: JSON.stringify({
          anomalies: [],
          validation_failures: [],
          data_quality_score: 1.0,
          recommendations: []
        })
      };

      mockMakeAPICall.mockResolvedValue(mockResponse);
      
      const result = await agent.detectAnomalies([], schema);
      
      expect(mockMakeAPICall).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('[]')
          })
        ]),
        expect.any(Object)
      );
      expect(result.anomalies).toHaveLength(0);
    });
  });

  describe('suggestFixes', () => {
    const anomalies = [
      {
        field: 'email',
        type: 'format_invalid',
        affected_rows: [1],
        value: 'invalid-email'
      }
    ];

    const data = [
      { email: 'john@example.com' },
      { email: 'invalid-email' }
    ];

    test('suggests appropriate fixes for anomalies', async () => {
      const mockResponse = {
        content: JSON.stringify({
          fixes: [
            {
              anomaly_id: 0,
              fix_type: 'Automatic',
              transformation: 'validate_email_format',
              confidence: 0.9
            }
          ],
          required_user_input: ['Confirm email addresses'],
          prevention_rules: ['Add email format validation']
        })
      };

      mockMakeAPICall.mockResolvedValue(mockResponse);

      const result = await agent.suggestFixes(anomalies, data);

      expect(result.fixes).toHaveLength(1);
      expect(result.prevention_rules).toBeDefined();
      expect(mockMakeAPICall).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('email')
          })
        ]),
        expect.objectContaining({
          temperature: 0.3,
          response_format: { type: 'json_object' }
        })
      );
    });
  });

  describe('analyzeOutliers', () => {
    const data = [
      { age: 25, salary: 50000 },
      { age: 30, salary: 60000 },
      { age: 35, salary: 1000000 },
      { age: -5, salary: 45000 }
    ];

    const numericalFields = ['age', 'salary'];

    test('identifies statistical outliers', async () => {
      const mockResponse = {
        content: JSON.stringify({
          outliers: {
            age: [{ row: 3, value: -5, reason: 'below_minimum' }],
            salary: [{ row: 2, value: 1000000, reason: 'statistical_outlier' }]
          },
          statistics: {
            age: { mean: 21.25, std: 17.97 },
            salary: { mean: 288750, std: 472439.35 }
          },
          thresholds: {
            age: { min: 0, max: 120 },
            salary: { lower: 0, upper: 200000 }
          },
          visualization_suggestions: ['box_plot', 'scatter_plot'],
          confidence: 0.95
        })
      };

      mockMakeAPICall.mockResolvedValue(mockResponse);

      const result = await agent.analyzeOutliers(data, numericalFields);

      expect(result.outliers.age).toHaveLength(1);
      expect(result.outliers.salary).toHaveLength(1);
      expect(mockMakeAPICall).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('outliers')
          })
        ]),
        expect.objectContaining({
          temperature: 0.2,
          response_format: { type: 'json_object' }
        })
      );
    });

    test('handles dataset with no outliers', async () => {
      const normalData = [
        { age: 25, salary: 50000 },
        { age: 30, salary: 60000 },
        { age: 35, salary: 55000 }
      ];

      const mockResponse = {
        content: JSON.stringify({
          outliers: {
            age: [],
            salary: []
          },
          statistics: {
            age: { mean: 30, std: 5 },
            salary: { mean: 55000, std: 5000 }
          },
          thresholds: {
            age: { min: 0, max: 120 },
            salary: { lower: 0, upper: 200000 }
          },
          visualization_suggestions: ['box_plot'],
          confidence: 0.95
        })
      };

      mockMakeAPICall.mockResolvedValue(mockResponse);

      const result = await agent.analyzeOutliers(normalData, numericalFields);

      expect(result.outliers.age).toHaveLength(0);
      expect(result.outliers.salary).toHaveLength(0);
      expect(mockMakeAPICall).toHaveBeenCalled();
    });
  });
});