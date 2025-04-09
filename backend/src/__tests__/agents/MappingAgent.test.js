const { OpenAI } = require('openai');
const MappingAgent = require('../../agents/MappingAgent');

// Mock OpenAI
jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ 
              message: { 
                content: JSON.stringify({
                  mappings: [
                    {
                      input_field: 'Customer Name',
                      output_field: 'name',
                      confidence: 0.95,
                      variations: ['Client Name', 'Full Name']
                    },
                    {
                      input_field: 'Email',
                      output_field: 'email',
                      confidence: 0.98,
                      variations: ['Email Address']
                    }
                  ],
                  unmapped_fields: ['Custom Field'],
                  overall_confidence: 0.96
                })
              } 
            }],
            usage: { total_tokens: 10 },
            model: 'test-model'
          })
        }
      }
    }))
  };
});

describe('MappingAgent', () => {
  let agent;
  let mockCreate;
  const sampleFields = ['Customer Name', 'Email', 'Custom Field'];

  beforeEach(() => {
    jest.clearAllMocks();
    agent = new MappingAgent({
      model: 'test-model',
      temperature: 0.5
    });
    mockCreate = agent.openai.chat.completions.create;
  });

  describe('mapFields', () => {
    test('successfully maps fields to schema', async () => {
      const result = await agent.mapFields(sampleFields, 'customer');
      
      expect(result).toEqual({
        mappings: [
          {
            input_field: 'Customer Name',
            output_field: 'name',
            confidence: 0.95,
            variations: ['Client Name', 'Full Name']
          },
          {
            input_field: 'Email',
            output_field: 'email',
            confidence: 0.98,
            variations: ['Email Address']
          }
        ],
        unmapped_fields: ['Custom Field'],
        overall_confidence: 0.96,
        usage_stats: expect.objectContaining({
          timestamp: expect.any(Number),
          model_used: 'test-model',
          token_usage: expect.any(Object)
        })
      });

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'test-model',
        messages: [
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({ 
            role: 'user',
            content: expect.stringContaining(JSON.stringify(sampleFields))
          })
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      });
    });

    test('handles empty input fields', async () => {
      await expect(agent.mapFields([], 'customer')).rejects.toThrow('No input fields provided');
    });

    test('handles unknown schema type', async () => {
      await expect(agent.mapFields(sampleFields, 'unknown')).rejects.toThrow('Unknown schema type');
    });

    test('uses cache for repeated mappings', async () => {
      // First call
      await agent.mapFields(sampleFields, 'customer');
      
      // Second call with same input
      await agent.mapFields(sampleFields, 'customer');
      
      // Should only make one API call
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });
  });

  describe('addFieldVariations', () => {
    test('adds new variations to existing field', () => {
      const newVariations = ['Client Full Name', 'Customer Full Name'];
      agent.addFieldVariations('customer', 'name', newVariations);
      
      expect(agent.mappingDictionary.customer.name).toContain(newVariations[0]);
      expect(agent.mappingDictionary.customer.name).toContain(newVariations[1]);
    });

    test('handles invalid schema', () => {
      expect(() => {
        agent.addFieldVariations('invalid', 'name', ['Test']);
      }).toThrow('Invalid schema or field');
    });

    test('handles invalid field', () => {
      expect(() => {
        agent.addFieldVariations('customer', 'invalid', ['Test']);
      }).toThrow('Invalid schema or field');
    });
  });

  describe('getUsageStats', () => {
    test('returns correct usage statistics', async () => {
      await agent.mapFields(sampleFields, 'customer');
      await agent.mapFields(sampleFields, 'customer'); // Should hit cache
      
      const stats = agent.getUsageStats();
      
      expect(stats).toEqual({
        total_calls: 2,
        cache_hits: 1,
        cache_hit_rate: 0.5,
        field_stats: expect.any(Object)
      });
    });

    test('handles no usage', () => {
      const stats = agent.getUsageStats();
      expect(stats.cache_hit_rate).toBe(0);
    });
  });

  describe('with sample files', () => {
    test('maps customer fields correctly', async () => {
      const customerFields = [
        'Customer ID', 'Customer Name', 'Email', 'Phone',
        'Address', 'Status', 'Join Date'
      ];

      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              mappings: customerFields.map(field => ({
                input_field: field,
                output_field: field.toLowerCase().replace(/\s+/g, '_'),
                confidence: 0.95,
                variations: []
              })),
              unmapped_fields: [],
              overall_confidence: 0.95
            })
          }
        }],
        usage: { total_tokens: 10 }
      });

      const result = await agent.mapFields(customerFields, 'customer');
      expect(result.mappings).toHaveLength(customerFields.length);
      expect(result.unmapped_fields).toHaveLength(0);
      expect(result.overall_confidence).toBeGreaterThan(0.9);
    });

    test('maps driver fields correctly', async () => {
      const driverFields = [
        'Driver ID', 'Driver Name', 'License Number',
        'Vehicle Type', 'Status', 'Phone', 'Join Date'
      ];

      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              mappings: driverFields.map(field => ({
                input_field: field,
                output_field: field.toLowerCase().replace(/\s+/g, '_'),
                confidence: 0.95,
                variations: []
              })),
              unmapped_fields: [],
              overall_confidence: 0.95
            })
          }
        }],
        usage: { total_tokens: 10 }
      });

      const result = await agent.mapFields(driverFields, 'driver');
      expect(result.mappings).toHaveLength(driverFields.length);
      expect(result.unmapped_fields).toHaveLength(0);
      expect(result.overall_confidence).toBeGreaterThan(0.9);
    });

    test('maps vehicle fields correctly', async () => {
      const vehicleFields = [
        'Vehicle ID', 'Make', 'Model', 'Year',
        'Status', 'License Plate', 'Last Service Date'
      ];

      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              mappings: vehicleFields.map(field => ({
                input_field: field,
                output_field: field.toLowerCase().replace(/\s+/g, '_'),
                confidence: 0.95,
                variations: []
              })),
              unmapped_fields: [],
              overall_confidence: 0.95
            })
          }
        }],
        usage: { total_tokens: 10 }
      });

      const result = await agent.mapFields(vehicleFields, 'vehicle');
      expect(result.mappings).toHaveLength(vehicleFields.length);
      expect(result.unmapped_fields).toHaveLength(0);
      expect(result.overall_confidence).toBeGreaterThan(0.9);
    });
  });
}); 