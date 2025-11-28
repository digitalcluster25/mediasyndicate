import { prisma } from '../prisma';
import { RSSParser } from './RSSParser';
import { RatingService } from './RatingService';
// Lazy import для TelegramParser - загружается только при необходимости
let TelegramParser: typeof import('./TelegramParser').TelegramParser | null = null;

export class ImportService {
  public static async importFromSource(sourceId: string): Promise<{ imported: number; errors: number }> {
    const source = await prisma.source.findUnique({
      where: { id: sourceId },
    });

    if (!source || !source.isActive) {
      return { imported: 0, errors: 0 };
    }

    console.log(`[ImportService] Importing from source: ${source.name} (${source.url}, type: ${source.type})`);

    let imported = 0;
    let errors = 0;

    try {
      let feed: {
        title?: string;
        items: Array<{
          title: string;
          description?: string;
          link: string;
          pubDate?: Date;
          guid?: string;
          metrics?: {
            views: number;
            forwards: number;
            reactions: number;
            replies: number;
          };
        }>;
      };

      if (source.type === 'RSS') {
        feed = await RSSParser.parse(source.url);
        console.log(`[ImportService] RSS feed returned ${feed.items.length} items from ${source.name}`);
      } else if (source.type === 'TELEGRAM') {
        // Для Telegram url содержит username канала (например, @uniannet или https://t.me/uniannet)
        // TelegramParser.parse() сам нормализует URL через normalizeChannelUsername()
        // Lazy load TelegramParser
        try {
          if (!TelegramParser) {
            const telegramModule = await import('./TelegramParser');
            TelegramParser = telegramModule.TelegramParser;
          }
          console.log(`[ImportService] Parsing Telegram source: ${source.name}, URL: "${source.url}"`);
          feed = await TelegramParser.parse(source.url || '');
          console.log(`[ImportService] Telegram channel returned ${feed.items.length} items from ${source.name}`);
        } catch (error) {
          console.error(`[ImportService] Telegram parsing failed:`, error);
          throw new Error(`Telegram parsing failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      } else {
        console.warn(`[ImportService] Unknown source type: ${source.type}`);
        return { imported: 0, errors: 0 };
      }
      
      for (const item of feed.items) {
        if (!item.link) {
          console.warn(`[ImportService] Skipping item without link: ${item.title}`);
          continue;
        }

        try {
          // Сохраняем метрики если они есть (для Telegram)
          const metrics = (item as any).metrics || {};
          const publishedAt = item.pubDate || new Date();
          
          const article = await prisma.article.upsert({
            where: { url: item.link },
            update: {
              title: item.title,
              content: item.description || '',
              publishedAt: publishedAt,
              // Обновляем метрики только если они есть (Telegram)
              ...(metrics.views !== undefined && { views: metrics.views }),
              ...(metrics.forwards !== undefined && { forwards: metrics.forwards }),
              ...(metrics.reactions !== undefined && { reactions: metrics.reactions }),
              ...(metrics.replies !== undefined && { replies: metrics.replies }),
            },
            create: {
              title: item.title,
              url: item.link,
              content: item.description || '',
              publishedAt: publishedAt,
              sourceId: source.id,
              views: metrics.views || 0,
              forwards: metrics.forwards || 0,
              reactions: metrics.reactions || 0,
              replies: metrics.replies || 0,
            },
          });
          
          // Пересчитываем рейтинг после импорта
          try {
            await RatingService.updateArticleRating(article.id);
          } catch (ratingError) {
            console.warn(`[ImportService] Failed to update rating for article ${article.id}:`, ratingError);
            // Не считаем это критической ошибкой
          }
          
          imported++;
        } catch (error) {
          console.error(`[ImportService] Failed to import article: ${item.link}`, error);
          errors++;
        }
      }

      console.log(`[ImportService] Imported ${imported} articles from ${source.name}, ${errors} errors`);
    } catch (error) {
      console.error(`[ImportService] Failed to import source: ${source.url}`, error);
      errors++;
    }

    return { imported, errors };
  }

  public static async importAll(): Promise<{ imported: number; errors: number }> {
    const sources = await prisma.source.findMany({
      where: { isActive: true },
    });

    console.log(`[ImportService] Found ${sources.length} active sources`);

    let totalImported = 0;
    let totalErrors = 0;

    for (const source of sources) {
      if (source.type === 'RSS' || source.type === 'TELEGRAM') {
        const result = await this.importFromSource(source.id);
        totalImported += result.imported;
        totalErrors += result.errors;
      }
    }

    console.log(`[ImportService] Total imported: ${totalImported}, total errors: ${totalErrors}`);
    return { imported: totalImported, errors: totalErrors };
  }
}
