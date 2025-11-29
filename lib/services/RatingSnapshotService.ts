import { prisma } from '../prisma';

interface RatingSnapshot {
  timestamp: number;
  articles: Map<string, { position: number; rating: number }>;
}

// Хранение снимков в памяти (для каждого периода)
const snapshots: Record<string, RatingSnapshot> = {
  online: { timestamp: 0, articles: new Map() },
  hour: { timestamp: 0, articles: new Map() },
  day: { timestamp: 0, articles: new Map() }
};

// Интервалы обновления снимков (мс)
const SNAPSHOT_INTERVALS = {
  online: 30_000,   // 30 сек
  hour: 60_000,     // 1 мин
  day: 300_000      // 5 мин
};

export class RatingSnapshotService {
  /**
   * Получить рейтинг с динамикой позиций
   * @param updateMetrics - обновить метрики из Telegram перед получением рейтинга (по умолчанию false)
   */
  static async getLiveRating(period: 'online' | 'hour' | 'day', limit: number = 50, updateMetrics: boolean = false) {
    const now = Date.now();
    const interval = SNAPSHOT_INTERVALS[period];
    const snapshot = snapshots[period];
    
    // Время до следующего обновления
    const timeSinceLastUpdate = now - snapshot.timestamp;
    const timeUntilNextUpdate = Math.max(0, interval - timeSinceLastUpdate);
    const shouldUpdate = timeSinceLastUpdate >= interval || snapshot.timestamp === 0;
    
    // Опционально обновляем метрики из Telegram перед получением рейтинга
    if (updateMetrics) {
      try {
        // Lazy import чтобы избежать циклических зависимостей
        const { TelegramMetricsUpdateService } = await import('./TelegramMetricsUpdateService');
        await TelegramMetricsUpdateService.updateAllMetrics();
      } catch (error) {
        console.error('[RatingSnapshot] Failed to update metrics:', error);
        // Продолжаем работу даже если обновление метрик не удалось
      }
    }
    
    // Получаем текущий рейтинг из БД
    const articlesResult = await prisma.article.findMany({
      where: { rating: { gt: 0 } },
      orderBy: { rating: 'desc' },
      take: limit,
      include: { source: true }
    }).catch((error) => {
      console.error('[RatingSnapshot] Database error:', error);
      return [];
    });
    
    const articles = articlesResult;
    
    // Рассчитываем динамику
    const articlesWithDynamics = articles.map((article, index) => {
      const currentPosition = index + 1;
      const previousData = snapshot.articles.get(article.id);
      
      let positionChange = 0;
      let ratingDelta = 0;
      
      if (previousData && previousData.position > 0) {
        // + = поднялась вверх, - = опустилась вниз
        positionChange = previousData.position - currentPosition;
        ratingDelta = Math.round((article.rating - previousData.rating) * 10) / 10;
      }
      
      return {
        ...article,
        currentPosition,
        positionChange,
        ratingDelta,
        isNew: !previousData // Новая статья в рейтинге
      };
    });
    
    // Обновляем снимок если пора
    if (shouldUpdate) {
      const newSnapshot: RatingSnapshot = {
        timestamp: now,
        articles: new Map()
      };
      
      articles.forEach((article, index) => {
        newSnapshot.articles.set(article.id, {
          position: index + 1,
          rating: article.rating
        });
      });
      
      snapshots[period] = newSnapshot;
      console.log(`[RatingSnapshot] Updated ${period} snapshot with ${articles.length} articles`);
    }
    
    return {
      articles: articlesWithDynamics,
      lastUpdate: snapshot.timestamp || now,
      nextUpdate: now + timeUntilNextUpdate,
      timeUntilNextUpdate
    };
  }
}

