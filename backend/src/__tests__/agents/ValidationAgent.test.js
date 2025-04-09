const { OpenAI } = require('openai');
const ValidationAgent = require('../../agents/ValidationAgent');

// Mock OpenAI
jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockImplementation((params) => {
            const messages = params.messages;
            const userMessage = messages.find(m => m.role === 'user');
            const content = JSON.parse(userMessage.content);
            
            // Return empty fixes array if errors array is empty
            if (content.errors && content.errors.length === 0) {
              return Promise.resolve({
                choices: [{ 
                  message: { 
                    content: JSON.stringify({
                      fixes: []
                    })
                  } 
                }],
                usage: { total_tokens: 10 },
                model: 'test-model'
              });
            }

            // Return fixes for non-empty errors array
            return Promise.resolve({
              choices: [{ 
                message: { 
                  content: JSON.stringify({
                    inconsistencies: [
                      {
                        field: 'age',
                        type: 'inconsistent_value',
                        message: 'Age value is inconsistent with birth date',
                        severity: 2
                      }
                    ],
                    fixes: [
                      {
                        field: 'email',
                        type: 'invalid_format',
                        suggestion: 'Please enter a valid email address in the format: user@example.com'
                      }
                    ]
                  })
                } 
              }],
              usage: { total_tokens: 10 },
              model: 'test-model'
            });
          })
        }
      }
    }))
  };
});

describe('ValidationAgent', () => {
  let agent;
  let mockCreate;

  beforeEach(() => {
    jest.clearAllMocks();
    agent = new ValidationAgent({
      model: 'test-model',
      temperature: 0.5
    });
    mockCreate = agent.openai.chat.completions.create;
  });

  describe('validateData', () => {
    const sampleCustomerData = [
      {
        id: 'C001',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        join_date: '2023-01-01'
      },
      {
        id: 'C002',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: 'invalid-phone',
        join_date: '2023-02-01'
      }
    ];

    test('validates customer data correctly', async () => {
      const result = await agent.validateData(sampleCustomerData, 'customer');
      
      expect(result.errors).toContainEqual({
        field: 'phone',
        type: 'invalid_format',
        message: 'Field \'phone\' has invalid format',
        severity: 2,
        suggestion: expect.any(String)
      });

      expect(result.stats).toEqual({
        total_records: 2,
        error_count: expect.any(Number),
        field_errors: expect.any(Object),
        severity_counts: expect.any(Object)
      });

      expect(result.overall_confidence).toBeGreaterThanOrEqual(0);
      expect(result.overall_confidence).toBeLessThanOrEqual(1);
    });

    test('handles missing required fields', async () => {
      const invalidData = [
        {
          id: 'C001',
          // Missing name and email
          phone: '123-456-7890'
        }
      ];

      const result = await agent.validateData(invalidData, 'customer');
      
      expect(result.errors).toContainEqual({
        field: 'name',
        type: 'missing_required',
        message: 'Required field \'name\' is missing',
        severity: 3
      });

      expect(result.errors).toContainEqual({
        field: 'email',
        type: 'missing_required',
        message: 'Required field \'email\' is missing',
        severity: 3
      });
    });

    test('detects duplicate values', async () => {
      const duplicateData = [
        {
          id: 'C001',
          name: 'John Doe',
          email: 'john@example.com'
        },
        {
          id: 'C001', // Duplicate ID
          name: 'Jane Smith',
          email: 'jane@example.com'
        }
      ];

      const result = await agent.validateData(duplicateData, 'customer');
      
      expect(result.errors).toContainEqual({
        field: 'id',
        type: 'duplicate_value',
        message: 'Duplicate value found for field \'id\'',
        severity: 2
      });
    });

    test('handles empty data', async () => {
      await expect(agent.validateData([], 'customer'))
        .rejects.toThrow('No data provided for validation');
    });

    test('handles unknown schema type', async () => {
      await expect(agent.validateData(sampleCustomerData, 'unknown'))
        .rejects.toThrow('Unknown schema type');
    });
  });

  describe('validateField', () => {
    test('validates required field', () => {
      const errors = agent.validateField('name', '', 'customer');
      expect(errors).toContainEqual({
        field: 'name',
        type: 'missing_required',
        message: 'Required field \'name\' is missing',
        severity: 3
      });
    });

    test('validates email format', () => {
      const errors = agent.validateField('email', 'invalid-email', 'customer');
      expect(errors).toContainEqual({
        field: 'email',
        type: 'invalid_format',
        message: 'Field \'email\' has invalid format',
        severity: 2,
        suggestion: expect.any(String)
      });
    });

    test('validates phone format', () => {
      const errors = agent.validateField('phone', '123', 'customer');
      expect(errors).toContainEqual({
        field: 'phone',
        type: 'invalid_format',
        message: 'Field \'phone\' has invalid format',
        severity: 2,
        suggestion: expect.any(String)
      });
    });

    test('returns empty array for valid field', () => {
      const errors = agent.validateField('email', 'valid@example.com', 'customer');
      expect(errors).toHaveLength(0);
    });
  });

  describe('suggestFixes', () => {
    test('suggests fixes for validation errors', async () => {
      const errors = [
        {
          field: 'email',
          type: 'invalid_format',
          message: 'Invalid email format',
          severity: 2
        }
      ];

      const result = await agent.suggestFixes(errors);
      expect(result).toEqual(expect.any(Object));
      expect(result.fixes).toBeDefined();
      expect(result.fixes).toHaveLength(1);
      expect(result.fixes[0]).toEqual(expect.objectContaining({
        field: 'email',
        type: 'invalid_format',
        suggestion: expect.any(String)
      }));
    });

    test('handles empty errors array', async () => {
      const result = await agent.suggestFixes([]);
      expect(result).toEqual(expect.any(Object));
      expect(result.fixes).toBeDefined();
      expect(result.fixes).toHaveLength(0);
    });
  });
});