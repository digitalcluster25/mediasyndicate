import { prisma } from '../prisma';
import { AIService } from './AIService';

export interface ProcessingResult {
  country?: string;
  category?: string;
  summary?: string;
  rewrittenTitle?: string;
}

export class ArticleProcessingService {
  /**
   * Обрабатывает статью системными промптами
   * 1. Фильтрация по стране и категории
   * 2. Создание самари
   * 3. Переписывание заголовка
   */
  public static async processArticle(articleId: string): Promise<ProcessingResult> {
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: { source: true }
    });

    if (!article) {
      throw new Error(`Article ${articleId} not found`);
    }

    // Обновляем статус обработки
    await prisma.article.update({
      where: { id: articleId },
      data: { processingStatus: 'processing' }
    });

    try {
      const result: ProcessingResult = {};

      // 1. Фильтрация по стране и категории
      const filterResult = await this.filterArticle(article);
      result.country = filterResult.country;
      result.category = filterResult.category;

      // 2. Создание самари
      result.summary = await this.generateSummary(article);

      // 3. Переписывание заголовка
      result.rewrittenTitle = await this.rewriteTitle(article);

      // Сохраняем результаты
      await prisma.article.update({
        where: { id: articleId },
        data: {
          country: result.country,
          category: result.category,
          summary: result.summary,
          rewrittenTitle: result.rewrittenTitle,
          processingStatus: 'completed',
          processedAt: new Date()
        }
      });

      return result;
    } catch (error) {
      // Обновляем статус на failed
      await prisma.article.update({
        where: { id: articleId },
        data: { processingStatus: 'failed' }
      });
      throw error;
    }
  }

  /**
   * Фильтрует статью - определяет страну и категорию
   */
  private static async filterArticle(article: any): Promise<{ country?: string; category?: string }> {
    const prompt = await prisma.prompt.findUnique({
      where: { key: 'article_filter' }
    });

    if (!prompt || !prompt.isActive) {
      console.warn('[ArticleProcessingService] Filter prompt not found or inactive');
      return {};
    }

    // Вызываем AI для фильтрации
    const response = await this.callAI(prompt.content, {
      title: article.title,
      content: article.content.substring(0, 2000), // Ограничиваем длину
      source: article.source.name
    });

    // Парсим ответ AI (ожидаем JSON)
    try {
      const parsed = JSON.parse(response);
      return {
        country: parsed.country || undefined,
        category: parsed.category || undefined
      };
    } catch {
      // Если не JSON, пытаемся извлечь данные из текста
      return this.parseFilterResponse(response);
    }
  }

  /**
   * Генерирует самари статьи
   */
  private static async generateSummary(article: any): Promise<string | undefined> {
    const prompt = await prisma.prompt.findUnique({
      where: { key: 'article_summary' }
    });

    if (!prompt || !prompt.isActive) {
      console.warn('[ArticleProcessingService] Summary prompt not found or inactive');
      return undefined;
    }

    const response = await this.callAI(prompt.content, {
      title: article.title,
      content: article.content.substring(0, 3000), // Ограничиваем длину
      source: article.source.name
    });

    return response.trim() || undefined;
  }

  /**
   * Переписывает заголовок статьи
   */
  private static async rewriteTitle(article: any): Promise<string | undefined> {
    const prompt = await prisma.prompt.findUnique({
      where: { key: 'article_rewrite_title' }
    });

    if (!prompt || !prompt.isActive) {
      console.warn('[ArticleProcessingService] Rewrite title prompt not found or inactive');
      return undefined;
    }

    const response = await this.callAI(prompt.content, {
      title: article.title,
      content: article.content.substring(0, 2000),
      source: article.source.name
    });

    return response.trim() || undefined;
  }

  /**
   * Вызывает AI API
   */
  private static async callAI(promptTemplate: string, variables: Record<string, string>): Promise<string> {
    // Заменяем переменные в промпте
    let prompt = promptTemplate;
    for (const [key, value] of Object.entries(variables)) {
      prompt = prompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }

    try {
      return await AIService.call(prompt, {
        maxTokens: 2000,
        temperature: 0.7
      });
    } catch (error) {
      console.error('[ArticleProcessingService] AI call failed:', error);
      throw error;
    }
  }

  /**
   * Парсит ответ фильтрации из текста (если не JSON)
   */
  private static parseFilterResponse(response: string): { country?: string; category?: string } {
    const result: { country?: string; category?: string } = {};

    // Простой парсинг (можно улучшить)
    const countryMatch = response.match(/country[:\s]+([A-Z]{2})/i);
    if (countryMatch) {
      result.country = countryMatch[1].toUpperCase();
    }

    const categoryMatch = response.match(/category[:\s]+([a-z]+)/i);
    if (categoryMatch) {
      result.category = categoryMatch[1].toLowerCase();
    }

    return result;
  }

  /**
   * Обрабатывает все необработанные статьи
   */
  public static async processPendingArticles(limit: number = 50): Promise<{ processed: number; errors: number }> {
    const articles = await prisma.article.findMany({
      where: {
        OR: [
          { processingStatus: 'pending' },
          { processingStatus: null }
        ]
      },
      take: limit,
      orderBy: { createdAt: 'asc' }
    });

    let processed = 0;
    let errors = 0;

    for (const article of articles) {
      try {
        await this.processArticle(article.id);
        processed++;
      } catch (error) {
        console.error(`[ArticleProcessingService] Failed to process article ${article.id}:`, error);
        errors++;
      }
    }

    return { processed, errors };
  }
}

