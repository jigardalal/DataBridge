const { OpenAI } = require('openai');
const ClassificationAgent = require('../../agents/ClassificationAgent');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

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
                  classified_type: 'customers',
                  confidence_score: 0.95,
                  reasoning: 'Contains customer-related fields',
                  suggested_mappings: ['name', 'email']
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

describe('ClassificationAgent', () => {
  let agent;
  let mockCreate;

  beforeEach(() => {
    jest.clearAllMocks();
    agent = new ClassificationAgent({
      model: 'test-model',
      temperature: 0.5
    });
    mockCreate = agent.openai.chat.completions.create;
  });

  describe('classifyTabContent', () => {
    const sampleData = [
      { name: 'John Doe', email: 'john@example.com', type: 'regular' },
      { name: 'Jane Smith', email: 'jane@example.com', type: 'VIP' }
    ];

    test('successfully classifies customer data', async () => {
      const result = await agent.classifyTabContent(sampleData);
      
      expect(result).toEqual({
        classified_type: 'customers',
        confidence_score: 0.95,
        reasoning: 'Contains customer-related fields',
        suggested_mappings: ['name', 'email']
      });

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'test-model',
        messages: [
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({ 
            role: 'user',
            content: expect.stringContaining(JSON.stringify(Object.keys(sampleData[0])))
          })
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });
    });

    test('handles empty data', async () => {
      await expect(agent.classifyTabContent([])).rejects.toThrow();
    });

    test('accepts custom possible types', async () => {
      const customTypes = ['users', 'products'];
      await agent.classifyTabContent(sampleData, customTypes);
      
      const expectedContent = JSON.stringify({
        headers: Object.keys(sampleData[0]),
        sample_data: sampleData,
        possible_types: customTypes
      });

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'test-model',
        messages: [
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({
            role: 'user',
            content: expectedContent
          })
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });
    });

    // Test with actual sample files
    describe('with sample files', () => {
      const testFiles = [
        {
          name: 'Customer_List.csv',
          expectedType: 'customers',
          expectedFields: ['Customer ID', 'Customer Name', 'Email', 'Phone']
        },
        {
          name: 'Driver_List.csv',
          expectedType: 'drivers',
          expectedFields: ['Driver ID', 'Driver Name', 'License Number', 'Vehicle Type']
        },
        {
          name: 'Vehicle_List.csv',
          expectedType: 'vehicles',
          expectedFields: ['Vehicle ID', 'Make', 'Model', 'Year', 'Status']
        },
        {
          name: 'Order_List.csv',
          expectedType: 'orders',
          expectedFields: ['Order ID', 'Customer ID', 'Order Date', 'Total Amount']
        },
        {
          name: 'Product_List.csv',
          expectedType: 'products',
          expectedFields: ['Product ID', 'Product Name', 'Category', 'Price']
        }
      ];

      testFiles.forEach(({ name, expectedType, expectedFields }) => {
        test(`correctly classifies ${name}`, async () => {
          const filePath = path.join(__dirname, '..', '..', '..', 'sample_files', name);
          const data = await new Promise((resolve, reject) => {
            const results = [];
            fs.createReadStream(filePath)
              .pipe(csv())
              .on('data', (data) => results.push(data))
              .on('end', () => resolve(results))
              .on('error', reject);
          });

          // Mock the API response based on the expected type
          mockCreate.mockResolvedValueOnce({
            choices: [{
              message: {
                content: JSON.stringify({
                  classified_type: expectedType,
                  confidence_score: 0.95,
                  reasoning: `Contains ${expectedType}-related fields`,
                  suggested_mappings: expectedFields
                })
              }
            }]
          });

          const result = await agent.classifyTabContent(data);
          
          expect(result.classified_type).toBe(expectedType);
          expect(result.confidence_score).toBeGreaterThan(0.8);
          expect(result.suggested_mappings).toEqual(expect.arrayContaining(expectedFields));
        });
      });
    });
  });

  describe('identifySubCategories', () => {
    const sampleData = [
      { name: 'John Doe', type: 'regular', spend: 100 },
      { name: 'Jane Smith', type: 'VIP', spend: 1000 }
    ];

    test('successfully identifies sub-categories', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              sub_categories: ['regular', 'VIP'],
              special_cases: ['High spenders'],
              confidence: 0.9
            })
          }
        }]
      });

      const result = await agent.identifySubCategories(sampleData, 'customers');
      
      expect(result).toEqual({
        sub_categories: ['regular', 'VIP'],
        special_cases: ['High spenders'],
        confidence: 0.9
      });

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'test-model',
        messages: expect.arrayContaining([
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('customers')
          })
        ]),
        temperature: 0.4,
        response_format: { type: 'json_object' }
      });
    });

    test('handles empty data', async () => {
      await expect(agent.identifySubCategories([], 'customers')).rejects.toThrow();
    });

    test('handles invalid JSON response', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: 'invalid json'
          }
        }]
      });

      await expect(agent.identifySubCategories(sampleData, 'customers')).rejects.toThrow(Error);
    });
  });
}); 