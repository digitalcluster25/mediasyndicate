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

  /**
   * Пересчитать рейтинг с отслеживанием динамики позиций
   */
  public static async recalculateWithDynamics(): Promise<{
    updated: number;
    errors: number;
    newInTop: number;
    movedUp: number;
    movedDown: number;
  }> {
    console.log('[RatingService] Starting recalculation with dynamics...');

    // 1. Получить все статьи с текущими позициями и рейтингами
    const articles = await prisma.article.findMany({
      where: {
        rating: { gt: 0 } // Только с позитивным рейтингом
      },
      select: {
        id: true,
        views: true,
        forwards: true,
        reactions: true,
        replies: true,
        publishedAt: true,
        rating: true,
        currentPosition: true,
        firstSeenAt: true
      }
    });

    console.log(`[RatingService] Found ${articles.length} articles to update`);

    // 2. Пересчитать рейтинги
    const articlesWithNewRating = articles.map(article => ({
      ...article,
      newRating: this.calculateRating(
        article.views,
        article.forwards,
        article.reactions,
        article.replies,
        article.publishedAt
      )
    }));

    // 3. Отсортировать по новому рейтингу
    articlesWithNewRating.sort((a, b) => b.newRating - a.newRating);

    // 4. Подготовить данные для batch update
    let updated = 0;
    let errors = 0;
    let newInTop = 0;
    let movedUp = 0;
    let movedDown = 0;

    const updates = articlesWithNewRating.map((article, index) => {
      const newPosition = index + 1;
      const previousPosition = article.currentPosition || 0;
      // Если статья впервые в рейтинге, не показываем изменение
      const isFirstTime = article.currentPosition === 0 || article.currentPosition === null;
      const positionChange = isFirstTime ? 0 : (article.currentPosition - newPosition); // + = вверх, - = вниз
      const ratingDelta = article.newRating - article.rating;
      const isNew = !article.firstSeenAt || article.currentPosition === 0;

      if (isNew && newPosition <= 50) {
        newInTop++;
      }
      if (positionChange > 0) {
        movedUp++;
      } else if (positionChange < 0) {
        movedDown++;
      }

      return prisma.article.update({
        where: { id: article.id },
        data: {
          previousRating: article.rating,
          previousPosition: article.currentPosition || 0,
          rating: Math.round(article.newRating * 10) / 10,
          currentPosition: newPosition,
          positionChange,
          ratingDelta: Math.round(ratingDelta * 10) / 10,
          ratingUpdatedAt: new Date(),
          firstSeenAt: isNew ? new Date() : article.firstSeenAt
        }
      });
    });

    // 5. Выполнить batch update
    try {
      await Promise.all(updates);
      updated = articlesWithNewRating.length;
    } catch (error) {
      console.error('[RatingService] Batch update failed:', error);
      errors = articlesWithNewRating.length;
    }

    console.log(`[RatingService] Updated ${updated} articles, ${errors} errors`);
    console.log(`[RatingService] New in top: ${newInTop}, Moved up: ${movedUp}, Moved down: ${movedDown}`);

    return { updated, errors, newInTop, movedUp, movedDown };
  }

  /**
   * Получить топ статей с динамическими данными
   * Если позиции еще не установлены, использует сортировку по рейтингу
   */
  public static async getTrendingWithDynamics(limit: number = 50) {
    // Сначала проверим, есть ли статьи с установленными позициями
    const articlesWithPosition = await prisma.article.findFirst({
      where: {
        rating: { gt: 0 },
        currentPosition: { gt: 0 }
      }
    });

    // Если позиции установлены, используем их
    if (articlesWithPosition) {
      return await prisma.article.findMany({
        where: {
          rating: { gt: 0 },
          currentPosition: { gt: 0, lte: limit }
        },
        orderBy: {
          currentPosition: 'asc'
        },
        take: limit,
        include: {
          source: true
        }
      });
    }

    // Fallback: если позиции не установлены, используем сортировку по рейтингу
    // и устанавливаем позиции на лету
    const articles = await prisma.article.findMany({
      where: {
        rating: { gt: 0 }
      },
      orderBy: {
        rating: 'desc'
      },
      take: limit,
      include: {
        source: true
      }
    });

    // Устанавливаем позиции на лету для отображения
    return articles.map((article, index) => ({
      ...article,
      currentPosition: index + 1,
      positionChange: 0, // Нет данных для сравнения
      ratingDelta: 0, // Нет данных для сравнения
      previousRating: article.rating,
      previousPosition: 0
    }));
  }

}

