import { prisma } from '../prisma';
import { AIService } from './AIService';

export class RelatedArticlesService {
  /**
   * Находит и связывает похожие статьи
   */
  public static async findAndLinkRelated(articleId: string, limit: number = 10): Promise<number> {
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: { source: true }
    });

    if (!article) {
      throw new Error(`Article ${articleId} not found`);
    }

    // Ищем потенциально похожие статьи
    const candidates = await prisma.article.findMany({
      where: {
        id: { not: articleId },
        processingStatus: 'completed',
        category: article.category || undefined,
        country: article.country || undefined,
        publishedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // За последние 30 дней
        }
      },
      take: limit * 2, // Берем больше для фильтрации
      orderBy: { publishedAt: 'desc' }
    });

    if (candidates.length === 0) {
      return 0;
    }

    // Используем AI для определения похожести
    const related: Array<{ articleId: string; similarity: number; reason: string }> = [];

    for (const candidate of candidates) {
      const similarity = await this.calculateSimilarity(article, candidate);
      if (similarity > 0.5) { // Порог похожести
        related.push({
          articleId: candidate.id,
          similarity,
          reason: await this.getSimilarityReason(article, candidate)
        });
      }
    }

    // Сортируем по похожести и берем топ
    related.sort((a, b) => b.similarity - a.similarity);
    const topRelated = related.slice(0, limit);

    // Создаем связи в БД
    let linksCreated = 0;
    for (const rel of topRelated) {
      try {
        await prisma.articleRelation.upsert({
          where: {
            fromId_toId: {
              fromId: articleId,
              toId: rel.articleId
            }
          },
          create: {
            fromId: articleId,
            toId: rel.articleId,
            similarity: rel.similarity,
            reason: rel.reason
          },
          update: {
            similarity: rel.similarity,
            reason: rel.reason
          }
        });
        linksCreated++;
      } catch (error) {
        console.error(`[RelatedArticlesService] Failed to create link:`, error);
      }
    }

    return linksCreated;
  }

  /**
   * Вычисляет степень похожести двух статей
   */
  private static async calculateSimilarity(article1: any, article2: any): Promise<number> {
    const prompt = `Оцени степень похожести двух статей по шкале от 0 до 1, где:
- 0 = статьи совершенно разные
- 0.5 = статьи частично связаны
- 1 = статьи очень похожи или на одну тему

Первая статья:
Заголовок: ${article1.title}
Самари: ${article1.summary || article1.content.substring(0, 300)}

Вторая статья:
Заголовок: ${article2.title}
Самари: ${article2.summary || article2.content.substring(0, 300)}

Верни только число от 0 до 1 (например: 0.75) без дополнительных объяснений.`;

    try {
      const response = await AIService.call(prompt, {
        maxTokens: 10,
        temperature: 0.3
      });

      const similarity = parseFloat(response.trim());
      if (isNaN(similarity) || similarity < 0 || similarity > 1) {
        return 0;
      }
      return similarity;
    } catch (error) {
      console.error('[RelatedArticlesService] Failed to calculate similarity:', error);
      return 0;
    }
  }

  /**
   * Получает причину похожести статей
   */
  private static async getSimilarityReason(article1: any, article2: any): Promise<string> {
    const prompt = `Объясни кратко (одно предложение), почему эти две статьи связаны:

Первая статья: ${article1.title}
Вторая статья: ${article2.title}

Ответ должен быть кратким (до 100 символов).`;

    try {
      const response = await AIService.call(prompt, {
        maxTokens: 50,
        temperature: 0.5
      });
      return response.trim().substring(0, 200);
    } catch (error) {
      console.error('[RelatedArticlesService] Failed to get reason:', error);
      return 'Связанные статьи';
    }
  }

  /**
   * Обрабатывает все статьи и создает связи
   */
  public static async processAllArticles(limit: number = 50): Promise<{ processed: number; linksCreated: number }> {
    const articles = await prisma.article.findMany({
      where: {
        processingStatus: 'completed'
      },
      take: limit,
      orderBy: { publishedAt: 'desc' }
    });

    let processed = 0;
    let totalLinks = 0;

    for (const article of articles) {
      try {
        const links = await this.findAndLinkRelated(article.id);
        totalLinks += links;
        processed++;
      } catch (error) {
        console.error(`[RelatedArticlesService] Failed to process article ${article.id}:`, error);
      }
    }

    return { processed, linksCreated: totalLinks };
  }
}

