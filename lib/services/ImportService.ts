import { prisma } from '../prisma';
import { RSSParser } from './RSSParser';
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
        }>;
      };

      if (source.type === 'RSS') {
        feed = await RSSParser.parse(source.url);
        console.log(`[ImportService] RSS feed returned ${feed.items.length} items from ${source.name}`);
      } else if (source.type === 'TELEGRAM') {
        // Для Telegram url содержит username канала (например, @uniannet)
        // Lazy load TelegramParser
        if (!TelegramParser) {
          const telegramModule = await import('./TelegramParser');
          TelegramParser = telegramModule.TelegramParser;
        }
        feed = await TelegramParser.parse(source.url);
        console.log(`[ImportService] Telegram channel returned ${feed.items.length} items from ${source.name}`);
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
          await prisma.article.upsert({
            where: { url: item.link },
            update: {
              title: item.title,
              content: item.description || '',
              publishedAt: item.pubDate || new Date(),
            },
            create: {
              title: item.title,
              url: item.link,
              content: item.description || '',
              publishedAt: item.pubDate || new Date(),
              sourceId: source.id,
            },
          });
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
