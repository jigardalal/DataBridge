const MappingAgent = require('../../agents/MappingAgent');

// Mock BaseAgent's makeAPICall method
jest.mock('../../agents/BaseAgent', () => {
  return jest.fn().mockImplementation(() => {
    const mockResponse = {
      content: JSON.stringify({
        mappings: [
          { input_field: 'customer_name', target_field: 'name', confidence: 0.95 },
          { input_field: 'customer_email', target_field: 'email', confidence: 0.98 },
          { input_field: 'phone_number', target_field: 'phone', confidence: 0.9 }
        ],
        unmapped_fields: [],
        missing_required: ['address']
      })
    };

    const instance = {
      makeAPICall: jest.fn().mockImplementation(async (messages, options) => {
        // Verify that messages and options are provided
        if (!messages || !Array.isArray(messages)) {
          throw new Error('Messages must be an array');
        }
        return mockResponse;
      }),
      formatSystemMessage: jest.fn().mockReturnValue({
        role: 'system',
        content: 'You are an AI assistant specialized in data field mapping.'
      }),
      suggestFieldMappings: jest.fn().mockImplementation(async (inputData, targetSchema) => {
        const result = await instance.makeAPICall([
          instance.formatSystemMessage(),
          {
            role: 'user',
            content: JSON.stringify({ inputData, targetSchema })
          }
        ], {
          temperature: 0.2,
          response_format: { type: 'json_object' }
        });
        return JSON.parse(result.content);
      }),
      suggestTransformations: jest.fn().mockImplementation(async (mappedField, sampleValues, targetField) => {
        const result = await instance.makeAPICall([
          instance.formatSystemMessage(),
          {
            role: 'user',
            content: JSON.stringify({ mappedField, sampleValues, targetField })
          }
        ], {
          temperature: 0.3,
          response_format: { type: 'json_object' }
        });
        return JSON.parse(result.content);
      }),
      refineMappings: jest.fn().mockImplementation(async (currentMappings, userFeedback) => {
        const result = await instance.makeAPICall([
          instance.formatSystemMessage(),
          {
            role: 'user',
            content: JSON.stringify({ currentMappings, userFeedback })
          }
        ], {
          temperature: 0.3,
          response_format: { type: 'json_object' }
        });
        return JSON.parse(result.content);
      })
    };
    return instance;
  });
});

describe('MappingAgent', () => {
  let agent;

  beforeEach(() => {
    jest.clearAllMocks();
    agent = new MappingAgent();
  });

  describe('suggestFieldMappings', () => {
    const sampleData = [
      { customer_name: 'John Doe', customer_email: 'john@example.com', phone_number: '123-456-7890' },
      { customer_name: 'Jane Smith', customer_email: 'jane@example.com', phone_number: '098-765-4321' }
    ];

    const targetSchema = {
      name: { type: 'string', required: true },
      email: { type: 'string', required: true },
      phone: { type: 'string', required: false },
      address: { type: 'string', required: true }
    };

    test('suggests field mappings with confidence scores', async () => {
      const mockResponse = {
        content: JSON.stringify({
          mappings: [
            { input_field: 'customer_name', target_field: 'name', confidence: 0.95, transformation: null },
            { input_field: 'customer_email', target_field: 'email', confidence: 0.98, transformation: null },
            { input_field: 'phone_number', target_field: 'phone', confidence: 0.9, transformation: 'format_phone' }
          ],
          unmapped_fields: [],
          missing_required: ['address']
        })
      };

      agent.makeAPICall.mockResolvedValue(mockResponse);

      const result = await agent.suggestFieldMappings(sampleData, targetSchema);

      expect(result.mappings).toHaveLength(3);
      expect(result.missing_required).toContain('address');
      expect(agent.makeAPICall).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('customer_name')
          })
        ]),
        expect.objectContaining({
          temperature: 0.2,
          response_format: { type: 'json_object' }
        })
      );
    });

    test('handles empty input data', async () => {
      await agent.suggestFieldMappings([], targetSchema);
      
      expect(agent.makeAPICall).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('[]')
          })
        ]),
        expect.any(Object)
      );
    });
  });

  describe('suggestTransformations', () => {
    const mappedField = {
      input_field: 'phone_number',
      target_field: 'phone',
      confidence: 0.9
    };

    const sampleValues = [
      '123-456-7890',
      '(098) 765-4321',
      '5551234567'
    ];

    const targetField = {
      type: 'string',
      format: 'phone',
      required: true
    };

    test('suggests appropriate transformations', async () => {
      const mockResponse = {
        content: JSON.stringify({
          transformations: ['strip_non_numeric', 'format_phone_number'],
          validation_rules: ['length_equals_10', 'all_digits'],
          edge_cases: ['international_numbers', 'extensions'],
          example_transformed: ['1234567890', '0987654321']
        })
      };

      agent.makeAPICall.mockResolvedValue(mockResponse);

      const result = await agent.suggestTransformations(mappedField, sampleValues, targetField);

      expect(result.transformations).toHaveLength(2);
      expect(result.validation_rules).toBeDefined();
      expect(agent.makeAPICall).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('phone_number')
          })
        ]),
        expect.objectContaining({
          temperature: 0.3,
          response_format: { type: 'json_object' }
        })
      );
    });
  });

  describe('refineMappings', () => {
    const currentMappings = {
      mappings: [
        { input_field: 'customer_name', target_field: 'name', confidence: 0.95 }
      ]
    };

    const userFeedback = {
      corrections: [
        { input_field: 'customer_name', target_field: 'full_name' }
      ]
    };

    test('incorporates user feedback into mappings', async () => {
      const mockResponse = {
        content: JSON.stringify({
          updated_mappings: [
            { input_field: 'customer_name', target_field: 'full_name', confidence: 1.0 }
          ],
          learning_points: ['User prefers full_name as target field'],
          confidence_adjustments: { customer_name: 1.0 },
          new_transformation_rules: []
        })
      };

      agent.makeAPICall.mockResolvedValue(mockResponse);

      const result = await agent.refineMappings(currentMappings, userFeedback);

      expect(result.updated_mappings).toHaveLength(1);
      expect(result.learning_points).toBeDefined();
      expect(agent.makeAPICall).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('customer_name')
          })
        ]),
        expect.objectContaining({
          temperature: 0.3,
          response_format: { type: 'json_object' }
        })
      );
    });

    test('handles empty feedback', async () => {
      await agent.refineMappings(currentMappings, {});
      
      expect(agent.makeAPICall).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('{}')
          })
        ]),
        expect.any(Object)
      );
    });
  });
}); 