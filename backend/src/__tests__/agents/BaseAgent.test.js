const { OpenAI } = require('openai');
const BaseAgent = require('../../agents/BaseAgent');

// Mock OpenAI
jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation((config) => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'api response' } }],
            usage: { total_tokens: 10 },
            model: 'test-model'
          })
        }
      },
      completions: {
        create: jest.fn().mockResolvedValue({
          usage: { prompt_tokens: 10 }
        })
      }
    }))
  };
});

describe('BaseAgent', () => {
  let agent;
  let mockOpenAI;
  let mockCreate;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreate = jest.fn().mockResolvedValue({
      choices: [{ message: { content: 'api response' } }],
      usage: { total_tokens: 10 },
      model: 'test-model'
    });
    
    mockOpenAI = new (require('openai').OpenAI)({
      apiKey: 'test-key'
    });
    
    agent = new BaseAgent({
      model: 'test-model',
      temperature: 0.5,
      cacheTTL: 1000
    });
  });

  describe('constructor', () => {
    test('initializes with default values', () => {
      const defaultAgent = new BaseAgent();
      expect(defaultAgent.model).toBe('gpt-4-turbo-preview');
      expect(defaultAgent.temperature).toBe(0.7);
      expect(defaultAgent.cacheTTL).toBe(3600000);
    });

    test('accepts custom configuration', () => {
      expect(agent.model).toBe('test-model');
      expect(agent.temperature).toBe(0.5);
      expect(agent.cacheTTL).toBe(1000);
    });
  });

  describe('caching', () => {
    test('generates consistent cache keys', () => {
      const prompt = 'test prompt';
      const params = { max_tokens: 100 };
      
      const key1 = agent.generateCacheKey(prompt, params);
      const key2 = agent.generateCacheKey(prompt, params);
      
      expect(key1).toBe(key2);
    });

    test('stores and retrieves cached responses', () => {
      const key = 'test-key';
      const response = { content: 'test response' };
      
      agent.cacheResponse(key, response);
      const cached = agent.getCachedResponse(key);
      
      expect(cached).toEqual(response);
    });

    test('invalidates expired cache entries', async () => {
      const key = 'test-key';
      const response = { content: 'test response' };
      
      agent.cacheResponse(key, response);
      await new Promise(resolve => setTimeout(resolve, 1100)); // Wait for cache to expire
      
      const cached = agent.getCachedResponse(key);
      expect(cached).toBeNull();
    });
  });

  describe('makeAPICall', () => {
    test('returns cached response when available', async () => {
      const messages = [{ role: 'user', content: 'test' }];
      const cachedResponse = { content: 'cached response' };
      
      jest.spyOn(agent, 'generateCacheKey').mockReturnValue('test-key');
      jest.spyOn(agent, 'getCachedResponse').mockReturnValue(cachedResponse);
      
      const result = await agent.makeAPICall(messages);
      
      expect(result).toBe(cachedResponse);
      expect(agent.openai.chat.completions.create).not.toHaveBeenCalled();
    });

    test('makes API call when no cache available', async () => {
      const messages = [{ role: 'user', content: 'test' }];
      
      const result = await agent.makeAPICall(messages);

      expect(agent.openai.chat.completions.create).toHaveBeenCalledWith({
        model: 'test-model',
        messages,
        temperature: 0.5
      });
      expect(result).toEqual({
        content: 'api response',
        usage: { total_tokens: 10 },
        model: 'test-model'
      });
    });

    test('handles API errors', async () => {
      const messages = [{ role: 'user', content: 'test' }];
      const mockError = new Error('API Error');
      
      // Override the create method to throw an error
      agent.openai.chat.completions.create = jest.fn().mockRejectedValue(mockError);

      await expect(agent.makeAPICall(messages)).rejects.toThrow('API Error');
    });
  });

  describe('countTokens', () => {
    test('uses OpenAI tokenizer when available', async () => {
      const text = 'test text';
      const mockCreate = jest.fn().mockResolvedValue({
        usage: { prompt_tokens: 10 }
      });

      const mockOpenAI = {
        completions: { create: mockCreate }
      };

      agent.openai = mockOpenAI;
      const result = await agent.countTokens(text);

      expect(result).toBe(10);
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo-instruct',
        prompt: text,
        max_tokens: 0,
        echo: true
      });
    });

    test('falls back to estimation when tokenizer fails', async () => {
      const text = 'test text';
      const mockCreate = jest.fn().mockRejectedValue(new Error('API Error'));

      const mockOpenAI = {
        completions: { create: mockCreate }
      };

      agent.openai = mockOpenAI;
      const result = await agent.countTokens(text);

      expect(result).toBe(Math.ceil(text.length / 4));
    });
  });
}); 