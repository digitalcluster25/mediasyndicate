import { PromptService } from './prompt-service';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface GroqAnalysis {
  category: string;
  isUkraineRelevant: boolean;
  keywords: string[];
  summary: string;
  sentiment: 'позитивный' | 'нейтральный' | 'негативный';
}

/**
 * Анализ статьи через Groq API
 */
export async function analyzeArticle(
  title: string,
  content: string
): Promise<GroqAnalysis> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not configured');
  }

  try {
    // Получаем промпт из базы данных
    const prompt = await PromptService.getPrompt('analyze_article', {
      title,
      content
    });

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'Ты - эксперт по анализу новостей. Всегда возвращай валидный JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const analysis = JSON.parse(data.choices[0].message.content);

    return analysis as GroqAnalysis;
  } catch (error) {
    console.error('[Groq analyzeArticle Error]:', error);
    throw error;
  }
}

/**
 * Генерация summary для кластера статей
 */
export async function generateClusterSummary(summaries: string[]): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not configured');
  }

  try {
    // Получаем промпт из базы данных
    const prompt = await PromptService.getPrompt('cluster_summary', {
      summaries: summaries.join('\n\n')
    });

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('[Groq generateClusterSummary Error]:', error);
    throw error;
  }
}

/**
 * Фильтрация статей по релевантности Украине
 */
export async function checkUkraineRelevance(
  title: string,
  content: string
): Promise<{ isUkraineRelevant: boolean; confidence: number; reason: string }> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not configured');
  }

  try {
    // Получаем промпт из базы данных
    const prompt = await PromptService.getPrompt('ukraine_filter', {
      title,
      content
    });

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'Ты - эксперт по анализу новостей. Всегда возвращай валидный JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return {
      isUkraineRelevant: result.isUkraineRelevant || false,
      confidence: result.confidence || 0.5,
      reason: result.reason || 'No reason provided'
    };
  } catch (error) {
    console.error('[Groq checkUkraineRelevance Error]:', error);
    throw error;
  }
}


