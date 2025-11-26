import { prisma } from '../prisma';
import { RSSParser } from './RSSParser';

export class ImportService {
  public static async importFromSource(sourceId: string): Promise<{ imported: number; errors: number }> {
    const source = await prisma.source.findUnique({
      where: { id: sourceId },
    });

    if (!source || !source.isActive || source.type !== 'RSS') {
      return { imported: 0, errors: 0 };
    }

    console.log(`[ImportService] Importing from source: ${source.name} (${source.url})`);

    let imported = 0;
    let errors = 0;

    try {
      const feed = await RSSParser.parse(source.url);
      console.log(`[ImportService] RSS feed returned ${feed.items.length} items from ${source.name}`);
      
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
      if (source.type === 'RSS') {
        const result = await this.importFromSource(source.id);
        totalImported += result.imported;
        totalErrors += result.errors;
      }
    }

    console.log(`[ImportService] Total imported: ${totalImported}, total errors: ${totalErrors}`);
    return { imported: totalImported, errors: totalErrors };
  }
}
