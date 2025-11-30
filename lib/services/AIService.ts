/**
 * Сервис для работы с AI API
 * Поддерживает OpenAI и Anthropic (Claude)
 */

interface AIConfig {
  provider: 'openai' | 'anthropic';
  apiKey: string;
  model?: string;
}

export class AIService {
  private static config: AIConfig | null = null;

  /**
   * Инициализирует конфигурацию AI
   */
  public static init(config: AIConfig) {
    this.config = config;
  }

  /**
   * Вызывает AI с промптом и возвращает ответ
   */
  public static async call(prompt: string, options?: {
    maxTokens?: number;
    temperature?: number;
  }): Promise<string> {
    if (!this.config) {
      // Пытаемся получить из env
      const provider = process.env.AI_PROVIDER || 'openai';
      const apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
      
      if (!apiKey) {
        throw new Error('AI API key not configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY');
      }

      this.config = {
        provider: provider as 'openai' | 'anthropic',
        apiKey,
        model: process.env.AI_MODEL
      };
    }

    if (this.config.provider === 'openai') {
      return this.callOpenAI(prompt, options);
    } else {
      return this.callAnthropic(prompt, options);
    }
  }

  /**
   * Вызывает OpenAI API
   */
  private static async callOpenAI(prompt: string, options?: {
    maxTokens?: number;
    temperature?: number;
  }): Promise<string> {
    const model = this.config?.model || 'gpt-4o-mini';
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config?.apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: options?.maxTokens || 2000,
        temperature: options?.temperature || 0.7
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  /**
   * Вызывает Anthropic API
   */
  private static async callAnthropic(prompt: string, options?: {
    maxTokens?: number;
    temperature?: number;
  }): Promise<string> {
    const model = this.config?.model || 'claude-3-5-sonnet-20241022';
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config?.apiKey || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: options?.maxTokens || 2000,
        temperature: options?.temperature || 0.7,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${error}`);
    }

    const data = await response.json();
    return data.content[0]?.text || '';
  }
}

