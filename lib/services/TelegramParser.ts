/**
 * Telegram Parser - парсинг каналов через RSS Bridge
 * 
 * ИСПОЛЬЗУЕТ RSS Bridge: https://rsshub.app/telegram/channel/CHANNEL
 * Это обычный RSS feed, парсится через RSSParser
 */

import { RSSParser } from './RSSParser';

export class TelegramParser {
  private static readonly RSS_BRIDGE_BASE = 'https://rsshub.app/telegram/channel';


  /**
   * Нормализация username канала для RSS Bridge
   * Преобразует различные форматы в username без @
   * 
   * Примеры:
   * - "https://t.me/uniannet" -> "uniannet"
   * - "https://t.me/uniannet/123" -> "uniannet"
   * - "@uniannet" -> "uniannet"
   * - "uniannet" -> "uniannet"
   */
  public static normalizeChannelUsername(input: string): string {
    let username = input.trim();
    
    // Убрать префикс https://t.me/ или http://t.me/
    if (username.startsWith('https://t.me/') || username.startsWith('http://t.me/')) {
      username = username.replace(/^https?:\/\/t\.me\//, '');
      // Убрать путь после username (например, /123)
      username = username.split('/')[0];
    }
    
    // Убрать префикс t.me/ если есть
    if (username.startsWith('t.me/')) {
      username = username.replace(/^t\.me\//, '');
      username = username.split('/')[0];
    }
    
    // Убрать @ если есть
    if (username.startsWith('@')) {
      username = username.slice(1);
    }
    
    console.log(`[TelegramParser] normalizeChannelUsername: "${input}" -> "${username}"`);
    
    return username;
  }


  /**
   * Парсинг канала через RSS Bridge - возвращает формат аналогичный RSS
   * 
   * ВАЖНО: RSS Hub может быть недоступен из-за Cloudflare защиты.
   * В этом случае возвращается пустой результат вместо ошибки.
   */
  public static async parse(channelUsername: string): Promise<{
    title: string;
    description?: string;
    items: Array<{
      title: string;
      description?: string;
      link: string;
      pubDate: Date;
      guid?: string;
    }>;
  }> {
    // Нормализуем username (убираем @ и префиксы)
    const username = this.normalizeChannelUsername(channelUsername);
    
    console.log(`[TelegramParser] parse() called with: "${channelUsername}" -> normalized: "${username}"`);
    
    try {
      // Формируем URL для RSS Bridge
      const rssUrl = `${this.RSS_BRIDGE_BASE}/${username}`;
      console.log(`[TelegramParser] Fetching RSS from: ${rssUrl}`);
      
      // Используем RSSParser для парсинга RSS feed
      const feed = await RSSParser.parse(rssUrl);
      
      console.log(`[TelegramParser] RSS Bridge returned ${feed.items.length} items from ${username}`);
      
      return {
        title: feed.title || `Telegram: ${username}`,
        description: feed.description,
        items: feed.items.map((item) => ({
          title: item.title,
          description: item.description,
          link: item.link,
          pubDate: item.pubDate || new Date(),
          guid: item.guid || item.link
        }))
      };
    } catch (error) {
      // RSS Hub может быть недоступен (Cloudflare, rate limit, timeout)
      // Вместо ошибки возвращаем пустой результат
      console.warn(`[TelegramParser] RSS Bridge unavailable for ${username}:`, error instanceof Error ? error.message : String(error));
      console.warn(`[TelegramParser] RSS Hub may be protected by Cloudflare or rate-limited. Returning empty result.`);
      
      return {
        title: `Telegram: ${username}`,
        description: undefined,
        items: []
      };
    }
  }
}
