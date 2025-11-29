import { prisma } from '../prisma';
import { TelegramParser } from './TelegramParser';
import { RatingService } from './RatingService';

/**
 * Сервис для обновления метрик статей из Telegram каналов
 * Обновляет views, forwards, reactions, replies для существующих статей
 */
export class TelegramMetricsUpdateService {
  /**
   * Обновить метрики для всех статей из Telegram источников
   */
  public static async updateAllMetrics(): Promise<{
    sourcesProcessed: number;
    articlesUpdated: number;
    errors: number;
  }> {
    console.log('[TelegramMetricsUpdate] Starting metrics update...');

    // Получаем все активные Telegram источники
    const telegramSources = await prisma.source.findMany({
      where: {
        type: 'TELEGRAM',
        isActive: true
      }
    });

    if (telegramSources.length === 0) {
      console.log('[TelegramMetricsUpdate] No active Telegram sources found');
      return { sourcesProcessed: 0, articlesUpdated: 0, errors: 0 };
    }

    let totalUpdated = 0;
    let totalErrors = 0;

    // Обрабатываем каждый источник
    for (const source of telegramSources) {
      try {
        console.log(`[TelegramMetricsUpdate] Processing source: ${source.name} (${source.url})`);
        
        // Парсим канал и получаем актуальные метрики
        const feed = await TelegramParser.parse(source.url);
        
        let sourceUpdated = 0;
        let sourceErrors = 0;

        // Обновляем метрики для каждой статьи
        for (const item of feed.items) {
          if (!item.link || !item.metrics) continue;

          try {
            // Находим статью по URL
            const article = await prisma.article.findUnique({
              where: { url: item.link }
            });

            if (!article) {
              // Статья не найдена - возможно еще не импортирована
              continue;
            }

            // Обновляем метрики
            const updated = await prisma.article.update({
              where: { id: article.id },
              data: {
                views: item.metrics.views || 0,
                forwards: item.metrics.forwards || 0,
                reactions: item.metrics.reactions || 0,
                replies: item.metrics.replies || 0
              }
            });

            // Пересчитываем рейтинг для обновленной статьи
            await RatingService.updateArticleRating(updated.id);

            sourceUpdated++;
          } catch (error) {
            console.error(`[TelegramMetricsUpdate] Failed to update article ${item.link}:`, error);
            sourceErrors++;
          }
        }

        console.log(`[TelegramMetricsUpdate] ${source.name}: updated ${sourceUpdated} articles, ${sourceErrors} errors`);
        totalUpdated += sourceUpdated;
        totalErrors += sourceErrors;
      } catch (error) {
        console.error(`[TelegramMetricsUpdate] Failed to process source ${source.name}:`, error);
        totalErrors++;
      }
    }

    console.log(`[TelegramMetricsUpdate] Completed: ${totalUpdated} articles updated, ${totalErrors} errors`);

    return {
      sourcesProcessed: telegramSources.length,
      articlesUpdated: totalUpdated,
      errors: totalErrors
    };
  }

  /**
   * Обновить метрики для конкретного источника
   */
  public static async updateSourceMetrics(sourceId: string): Promise<{
    articlesUpdated: number;
    errors: number;
  }> {
    const source = await prisma.source.findUnique({
      where: { id: sourceId }
    });

    if (!source || source.type !== 'TELEGRAM' || !source.isActive) {
      throw new Error(`Source ${sourceId} is not an active Telegram source`);
    }

    console.log(`[TelegramMetricsUpdate] Updating metrics for source: ${source.name}`);

    const feed = await TelegramParser.parse(source.url);
    
    let updated = 0;
    let errors = 0;

    for (const item of feed.items) {
      if (!item.link || !item.metrics) continue;

      try {
        const article = await prisma.article.findUnique({
          where: { url: item.link }
        });

        if (!article) continue;

        const updatedArticle = await prisma.article.update({
          where: { id: article.id },
          data: {
            views: item.metrics.views || 0,
            forwards: item.metrics.forwards || 0,
            reactions: item.metrics.reactions || 0,
            replies: item.metrics.replies || 0
          }
        });

        await RatingService.updateArticleRating(updatedArticle.id);
        updated++;
      } catch (error) {
        console.error(`[TelegramMetricsUpdate] Failed to update article ${item.link}:`, error);
        errors++;
      }
    }

    return { articlesUpdated: updated, errors };
  }
}

