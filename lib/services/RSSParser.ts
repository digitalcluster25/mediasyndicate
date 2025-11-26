import Parser from 'rss-parser';

const parser = new Parser();

export interface RSSItem {
  title: string;
  description?: string;
  link: string;
  pubDate?: Date;
  guid?: string;
}

export interface RSSFeed {
  title?: string;
  description?: string;
  link?: string;
  items: RSSItem[];
}

export class RSSParser {
  public static async parse(url: string): Promise<RSSFeed> {
    console.log(`[RSSParser] Parsing RSS feed: ${url}`);
    try {
      const feed = await parser.parseURL(url);

      const items: RSSItem[] = (feed.items || []).map((item) => ({
        title: item.title || '',
        description: item.contentSnippet || item.content || undefined,
        link: item.link || '',
        pubDate: item.pubDate ? new Date(item.pubDate) : undefined,
        guid: item.guid || item.id || undefined,
      }));

      console.log(`[RSSParser] Feed parsed: ${items.length} items`);
      if (items.length > 0) {
        console.log(`[RSSParser] First item: ${items[0].title}`);
      }

      return {
        title: feed.title || undefined,
        description: feed.description || undefined,
        link: feed.link || undefined,
        items,
      };
    } catch (error) {
      console.error(`[RSSParser] Failed to parse RSS feed: ${url}`, error);
      throw new Error(`Failed to parse RSS feed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
