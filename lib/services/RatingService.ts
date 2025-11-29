import { prisma } from '../prisma';

/**
 * RatingService - расчет рейтинга по формуле Mediametrics
 * 
 * Формула: Rating = (Views×0.05) + (Forwards×8) + (Reactions×3) + (Replies×5) - (Age×2)
 * 
 * Где:
 * - Views × 0.05 (низкий вес)
 * - Forwards × 8 (самый высокий вес!)
 * - Reactions × 3
 * - Replies × 5
 * - Age × 2 (штраф за старость в часах)
 * 
 * Рейтинг может быть отрицательным
 */
export class RatingService {
  /**
   * Рассчитать рейтинг для одной статьи
   */
  public static calculateRating(
    views: number,
    forwards: number,
    reactions: number,
    replies: number,
    publishedAt: Date
  ): number {
    // Возраст статьи в часах
    const ageHours = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60);
    
    // Формула Mediametrics
    const rating = 
      (views * 0.05) +
      (forwards * 8) +
      (reactions * 3) +
      (replies * 5) -
      (ageHours * 2);
    
    // Округляем до 2 знаков после запятой
    return Math.round(rating * 100) / 100;
  }

  /**
   * Обновить рейтинг для одной статьи
   */
  public static async updateArticleRating(articleId: string): Promise<number> {
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: {
        views: true,
        forwards: true,
        reactions: true,
        replies: true,
        publishedAt: true
      }
    });

    if (!article) {
      throw new Error(`Article ${articleId} not found`);
    }

    const rating = this.calculateRating(
      article.views,
      article.forwards,
      article.reactions,
      article.replies,
      article.publishedAt
    );

    await prisma.article.update({
      where: { id: articleId },
      data: { 
        rating,
        ratingUpdatedAt: new Date()
      }
    });

    return rating;
  }

  /**
   * Пересчитать рейтинг для всех статей
   * @param hoursBack - опционально, пересчитать только статьи за последние N часов. Если не указано, пересчитывает все статьи.
   */
  public static async recalculateAllRatings(hoursBack?: number): Promise<{
    updated: number;
    errors: number;
  }> {
    console.log('[RatingService] Starting recalculation of all ratings...');

    const whereClause = hoursBack ? {
      publishedAt: {
        gte: new Date(Date.now() - hoursBack * 60 * 60 * 1000)
      }
    } : {};

    const articles = await prisma.article.findMany({
      where: whereClause,
      select: {
        id: true,
        views: true,
        forwards: true,
        reactions: true,
        replies: true,
        publishedAt: true
      }
    });

    console.log(`[RatingService] Found ${articles.length} articles to update`);

    let updated = 0;
    let errors = 0;

    for (const article of articles) {
      try {
        const rating = this.calculateRating(
          article.views,
          article.forwards,
          article.reactions,
          article.replies,
          article.publishedAt
        );

        await prisma.article.update({
          where: { id: article.id },
          data: { 
            rating: Math.round(rating * 10) / 10,
            ratingUpdatedAt: new Date()
          }
        });

        updated++;
      } catch (error) {
        console.error(`[RatingService] Failed to update rating for article ${article.id}:`, error);
        errors++;
      }
    }

    console.log(`[RatingService] Updated ${updated} articles, ${errors} errors`);

    return { updated, errors };
  }

  /**
   * Получить топ статей по рейтингу
   */
  public static async getTopArticles(limit: number = 10) {
    return prisma.article.findMany({
      orderBy: { rating: 'desc' },
      take: limit,
      include: {
        source: {
          select: {
            name: true,
            type: true
          }
        }
      }
    });
  }

  /**
   * Получить топ статей по рейтингу (Trending)
   * Только статьи с позитивным рейтингом
   */
  public static async getTrending(limit: number = 50) {
    return await prisma.article.findMany({
      where: {
        rating: { gt: 0 } // Только с позитивным рейтингом
      },
      orderBy: {
        rating: 'desc'
      },
      take: limit,
      include: {
        source: true
      }
    });
  }

}

