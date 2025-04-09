const { OpenAI } = require('openai');
const crypto = require('crypto');

class BaseAgent {
  constructor(config = {}) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    this.model = config.model || 'gpt-4-turbo-preview';
    this.temperature = config.temperature || 0.7;
    this.cache = new Map();
    this.cacheTTL = config.cacheTTL || 3600000; // 1 hour in milliseconds
  }

  /**
   * Generate a cache key from the prompt and parameters
   */
  generateCacheKey(prompt, parameters = {}) {
    const data = JSON.stringify({ prompt, parameters, model: this.model });
    return crypto.createHash('md5').update(data).digest('hex');
  }

  /**
   * Check if a cached response exists and is still valid
   */
  getCachedResponse(cacheKey) {
    const cached = this.cache.get(cacheKey);
    if (!cached) return null;

    const { timestamp, response } = cached;
    if (Date.now() - timestamp > this.cacheTTL) {
      this.cache.delete(cacheKey);
      return null;
    }

    return response;
  }

  /**
   * Cache a response with the current timestamp
   */
  cacheResponse(cacheKey, response) {
    this.cache.set(cacheKey, {
      timestamp: Date.now(),
      response,
    });
  }

  /**
   * Count tokens in a message using OpenAI's tokenizer
   */
  async countTokens(text) {
    try {
      const response = await this.openai.completions.create({
        model: 'gpt-3.5-turbo-instruct',
        prompt: text,
        max_tokens: 0,
        echo: true,
      });
      return response.usage.prompt_tokens;
    } catch (error) {
      console.error('Error counting tokens:', error);
      // Fallback to rough estimation (not as accurate)
      return Math.ceil(text.length / 4);
    }
  }

  /**
   * Make an API call with caching and token counting
   */
  async makeAPICall(messages, parameters = {}) {
    const cacheKey = this.generateCacheKey(messages, parameters);
    const cachedResponse = this.getCachedResponse(cacheKey);
    
    if (cachedResponse) {
      return cachedResponse;
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages,
        temperature: this.temperature,
        ...parameters,
      });

      const result = {
        content: response.choices[0].message.content,
        usage: response.usage,
        model: response.model,
      };

      this.cacheResponse(cacheKey, result);
      return result;
    } catch (error) {
      console.error('OpenAI API call failed:', error);
      throw error;
    }
  }

  /**
   * Format system message with the agent's role
   */
  formatSystemMessage(role) {
    return {
      role: 'system',
      content: `You are an AI assistant specialized in ${role}. Provide clear, accurate, and detailed responses based on the input provided.`,
    };
  }
}

module.exports = BaseAgent; 