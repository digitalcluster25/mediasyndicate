import { prisma } from '../prisma';
import { AIService } from './AIService';

export class ClusterService {
  /**
   * Создает кластеры из статей и определяет продолжения тем
   */
  public static async createClusters(limit: number = 100): Promise<{ clustersCreated: number; continuationsFound: number }> {
    // Получаем статьи, которые еще не в кластерах
    const articles = await prisma.article.findMany({
      where: {
        clusterId: null,
        processingStatus: 'completed',
        category: { not: null }
      },
      take: limit,
      orderBy: { publishedAt: 'desc' },
      include: { source: true }
    });

    if (articles.length === 0) {
      return { clustersCreated: 0, continuationsFound: 0 };
    }

    let clustersCreated = 0;
    let continuationsFound = 0;

    // Группируем статьи по категориям и странам
    const grouped = new Map<string, typeof articles>();
    for (const article of articles) {
      const key = `${article.category || 'unknown'}_${article.country || 'unknown'}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(article);
    }

    // Для каждой группы создаем кластеры
    for (const [key, groupArticles] of grouped) {
      // Анализируем статьи и создаем кластеры
      const clusters = await this.analyzeAndCreateClusters(groupArticles);
      
      for (const cluster of clusters) {
        // Создаем кластер в БД
        const dbCluster = await prisma.cluster.create({
          data: {
            name: cluster.name,
            description: cluster.description,
            isActive: true
          }
        });

        // Привязываем статьи к кластеру
        for (const articleId of cluster.articleIds) {
          await prisma.article.update({
            where: { id: articleId },
            data: { clusterId: dbCluster.id }
          });
        }

        clustersCreated++;

        // Определяем продолжения тем
        const continuations = await this.findContinuations(cluster.articleIds);
        for (const articleId of continuations) {
          await prisma.article.update({
            where: { id: articleId },
            data: { isContinuation: true }
          });
          continuationsFound++;
        }
      }
    }

    return { clustersCreated, continuationsFound };
  }

  /**
   * Анализирует статьи и создает кластеры
   */
  private static async analyzeAndCreateClusters(articles: any[]): Promise<Array<{
    name: string;
    description: string;
    articleIds: string[];
  }>> {
    if (articles.length === 0) return [];

    // Используем AI для группировки статей по темам
    const prompt = `Проанализируй следующие статьи и сгруппируй их по темам (кластерам).
Для каждой группы определи название темы и краткое описание.

Статьи:
${articles.map((a, i) => `${i + 1}. ${a.title}\n${a.summary || a.content.substring(0, 200)}`).join('\n\n')}

Верни результат в формате JSON:
{
  "clusters": [
    {
      "name": "Название темы",
      "description": "Краткое описание",
      "articleIndices": [0, 2, 5]
    }
  ]
}

Важно: группируй только статьи, которые действительно связаны одной темой.`;

    try {
      const response = await AIService.call(prompt, {
        maxTokens: 3000,
        temperature: 0.5
      });

      // Парсим JSON ответ
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // Если не JSON, создаем один кластер для всех статей
        return [{
          name: articles[0].category || 'Общая тема',
          description: 'Группа связанных статей',
          articleIds: articles.map(a => a.id)
        }];
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const clusters: Array<{ name: string; description: string; articleIds: string[] }> = [];

      for (const cluster of parsed.clusters || []) {
        const articleIds = (cluster.articleIndices || []).map((idx: number) => articles[idx]?.id).filter(Boolean);
        if (articleIds.length > 0) {
          clusters.push({
            name: cluster.name || 'Неизвестная тема',
            description: cluster.description || '',
            articleIds
          });
        }
      }

      return clusters.length > 0 ? clusters : [{
        name: articles[0].category || 'Общая тема',
        description: 'Группа связанных статей',
        articleIds: articles.map(a => a.id)
      }];
    } catch (error) {
      console.error('[ClusterService] Failed to analyze clusters:', error);
      // В случае ошибки создаем один кластер для всех статей
      return [{
        name: articles[0].category || 'Общая тема',
        description: 'Группа связанных статей',
        articleIds: articles.map(a => a.id)
      }];
    }
  }

  /**
   * Определяет статьи, которые являются продолжением темы (поддерживают "горение")
   */
  private static async findContinuations(articleIds: string[]): Promise<string[]> {
    if (articleIds.length < 2) return [];

    const articles = await prisma.article.findMany({
      where: { id: { in: articleIds } },
      orderBy: { publishedAt: 'asc' }
    });

    if (articles.length < 2) return [];

    // Первая статья - оригинальная, остальные могут быть продолжениями
    const continuations: string[] = [];

    for (let i = 1; i < articles.length; i++) {
      const current = articles[i];
      const previous = articles[i - 1];

      // Проверяем, является ли текущая статья продолжением предыдущей
      const isContinuation = await this.checkIfContinuation(previous, current);
      if (isContinuation) {
        continuations.push(current.id);
      }
    }

    return continuations;
  }

  /**
   * Проверяет, является ли статья продолжением другой
   */
  private static async checkIfContinuation(original: any, candidate: any): Promise<boolean> {
    const prompt = `Определи, является ли вторая статья продолжением или развитием темы первой статьи.

Первая статья (оригинал):
Заголовок: ${original.title}
Самари: ${original.summary || original.content.substring(0, 300)}

Вторая статья (кандидат):
Заголовок: ${candidate.title}
Самари: ${candidate.summary || candidate.content.substring(0, 300)}

Верни только "yes" или "no" без дополнительных объяснений.`;

    try {
      const response = await AIService.call(prompt, {
        maxTokens: 10,
        temperature: 0.3
      });

      return response.toLowerCase().trim().startsWith('yes');
    } catch (error) {
      console.error('[ClusterService] Failed to check continuation:', error);
      // В случае ошибки используем простую эвристику
      const timeDiff = candidate.publishedAt.getTime() - original.publishedAt.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      // Если опубликована в течение 24 часов после оригинальной, считаем продолжением
      return hoursDiff > 0 && hoursDiff < 24;
    }
  }
}

