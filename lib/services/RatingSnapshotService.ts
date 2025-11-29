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

// Интервал обновления метрик из Telegram (30 секунд)
const METRICS_UPDATE_INTERVAL = 30_000;
let lastMetricsUpdate = 0;

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
    
    // Автоматически обновляем метрики из Telegram каждые 30 секунд
    // ВАЖНО: Делаем это асинхронно, чтобы не блокировать ответ API
    const timeSinceLastMetricsUpdate = now - lastMetricsUpdate;
    const shouldUpdateMetrics = timeSinceLastMetricsUpdate >= METRICS_UPDATE_INTERVAL || updateMetrics;
    
    if (shouldUpdateMetrics && !updateMetrics) {
      // Обновляем метрики в фоне (не блокируем ответ)
      // Только если это не явный запрос на обновление
      (async () => {
        try {
          // Lazy import чтобы избежать циклических зависимостей
          const { TelegramMetricsUpdateService } = await import('./TelegramMetricsUpdateService');
          const { RatingService } = await import('./RatingService');
          
          console.log(`[RatingSnapshot] Updating metrics from Telegram (background)...`);
          await TelegramMetricsUpdateService.updateAllMetrics();
          
          // Пересчитываем рейтинг для всех статей (возраст меняется со временем)
          console.log(`[RatingSnapshot] Recalculating ratings for all articles (background)...`);
          await RatingService.recalculateAllRatings(168); // За последние 7 дней
          
          lastMetricsUpdate = Date.now();
        } catch (error) {
          console.error('[RatingSnapshot] Failed to update metrics (background):', error);
          // Не критично, продолжаем работу
        }
      })();
      
      // Обновляем timestamp, чтобы не запускать обновление снова сразу
      lastMetricsUpdate = now;
    } else if (updateMetrics) {
      // Явный запрос на обновление - делаем синхронно, но с таймаутом
      try {
        const { TelegramMetricsUpdateService } = await import('./TelegramMetricsUpdateService');
        const { RatingService } = await import('./RatingService');
        
        console.log(`[RatingSnapshot] Updating metrics from Telegram (sync)...`);
        
        // Добавляем таймаут для обновления метрик
        const updatePromise = Promise.all([
          TelegramMetricsUpdateService.updateAllMetrics(),
          RatingService.recalculateAllRatings(168)
        ]);
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Metrics update timeout')), 25000) // 25 секунд таймаут
        );
        
        await Promise.race([updatePromise, timeoutPromise]);
        lastMetricsUpdate = Date.now();
      } catch (error) {
        console.error('[RatingSnapshot] Failed to update metrics (sync):', error);
        // Продолжаем работу даже если обновление метрик не удалось
        lastMetricsUpdate = now; // Обновляем timestamp, чтобы не повторять сразу
      }
    }
    
    // Определяем временной интервал для фильтрации по периоду
    const periodMinutes = {
      online: 10,   // 10 минут
      hour: 60,      // 1 час
      day: 1440      // 24 часа
    }[period];
    
    const periodStartTime = new Date(now - periodMinutes * 60 * 1000);
    
    // Получаем текущий рейтинг из БД с фильтрацией по времени публикации
    const articlesResult = await prisma.article.findMany({
      where: { 
        rating: { gt: 0 },
        publishedAt: { gte: periodStartTime } // Только статьи за указанный период
      },
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
    
    // Рассчитываем время до следующего обновления метрик (всегда 30 секунд)
    const timeUntilNextMetricsUpdate = shouldUpdateMetrics 
      ? METRICS_UPDATE_INTERVAL // Только что обновили, следующий через 30 сек
      : Math.max(0, METRICS_UPDATE_INTERVAL - timeSinceLastMetricsUpdate);
    
    return {
      articles: articlesWithDynamics,
      lastUpdate: shouldUpdateMetrics ? now : (snapshot.timestamp || now),
      nextUpdate: now + timeUntilNextMetricsUpdate,
      timeUntilNextUpdate: timeUntilNextMetricsUpdate
    };
  }
}

