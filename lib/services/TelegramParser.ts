/**
 * Telegram Parser - парсинг каналов через Telegram Bot API и Web Scraping
 * 
 * ДВА МЕТОДА:
 * 1. Bot API (fetchChannelPosts) - требует подписки бота, только новые сообщения
 * 2. Web Scraping (fetchChannelPostsViaWebScraping) - работает для публичных каналов, получает историю
 * 
 * Парсер автоматически пробует оба метода:
 * - Сначала пытается Bot API
 * - Если постов нет, пробует Web Scraping
 */

export interface TelegramPost {
  id: number;
  text: string;
  date: Date;
  link?: string;
}

export interface TelegramChannelInfo {
  title: string;
  username?: string;
  description?: string;
  postsCount: number;
}

export class TelegramParser {
  private static readonly BOT_API_URL = 'https://api.telegram.org/bot';
  private static botToken: string | null = null;

  /**
   * Инициализация - получение токена из env
   */
  private static getBotToken(): string | null {
    if (!this.botToken) {
      this.botToken = process.env.TELEGRAM_BOT_TOKEN || null;
    }
    return this.botToken;
  }

  /**
   * Проверка доступности Telegram API
   */
  private static isAvailable(): boolean {
    return !!this.getBotToken();
  }

  /**
   * Нормализация username канала
   * Преобразует различные форматы в стандартный @username
   * 
   * Примеры:
   * - "https://t.me/uniannet" -> "@uniannet"
   * - "https://t.me/uniannet/123" -> "@uniannet"
   * - "@uniannet" -> "@uniannet"
   * - "uniannet" -> "@uniannet"
   */
  private static normalizeChannelUsername(input: string): string {
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
    
    // Убрать @ если уже есть
    if (username.startsWith('@')) {
      username = username.slice(1);
    }
    
    // Добавить @ в начало
    const normalized = `@${username}`;
    
    console.log(`[TelegramParser] normalizeChannelUsername: "${input}" -> "${normalized}"`);
    
    return normalized;
  }

  /**
   * Получить информацию о канале
   */
  public static async getChannelInfo(channelUsername: string): Promise<TelegramChannelInfo> {
    if (!this.isAvailable()) {
      throw new Error('TELEGRAM_BOT_TOKEN not configured. Telegram parsing requires bot token.');
    }

    const token = this.getBotToken()!;
    const normalized = this.normalizeChannelUsername(channelUsername);
    const username = normalized.slice(1); // Убрать @ для API
    
    try {
      // Получить информацию о канале через getChat
      const response = await fetch(`${this.BOT_API_URL}${token}/getChat?chat_id=@${username}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.description || 'Failed to get channel info');
      }

      const data = await response.json();
      
      if (!data.ok) {
        throw new Error(data.description || 'Failed to get channel info');
      }

      const chat = data.result;

      return {
        title: chat.title || username,
        username: chat.username,
        description: chat.description,
        postsCount: 0 // Будет обновлено при парсинге постов
      };
    } catch (error) {
      console.error(`[TelegramParser] Failed to get channel info for @${username}:`, error);
      throw new Error(`Failed to get channel info: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Получить последние посты из канала через Web Scraping (публичные каналы)
   * 
   * Работает для публичных каналов без подписки бота
   * Парсит HTML страницу t.me/s/channelname
   */
  public static async fetchChannelPostsViaWebScraping(
    channelUsername: string,
    limit: number = 20
  ): Promise<TelegramPost[]> {
    const normalized = this.normalizeChannelUsername(channelUsername);
    const username = normalized.slice(1); // Убрать @
    
    console.log(`[TelegramParser] Web scraping posts from ${normalized}, limit: ${limit}`);
    
    try {
      // Загружаем страницу канала
      const url = `https://t.me/s/${username}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch channel page: ${response.status}`);
      }
      
      const html = await response.text();
      
      // Парсим JSON данные из скрипта на странице
      // Telegram загружает данные в window.__initialData__
      const jsonMatch = html.match(/window\.__initialData__\s*=\s*({[\s\S]+?});/);
      
      if (!jsonMatch) {
        // Альтернативный способ - ищем в script тегах
        const scriptMatch = html.match(/<script[^>]*>[\s\S]*?window\.__initialData__\s*=\s*({[\s\S]+?});[\s\S]*?<\/script>/);
        if (!scriptMatch) {
          console.warn('[TelegramParser] Could not find JSON data in page, using HTML parsing only');
        }
      }
      
      // Пробуем парсить через cheerio (lazy import)
      const { load } = await import('cheerio');
      const $ = load(html);
      
      const posts: TelegramPost[] = [];
      
      // Ищем посты в структуре страницы
      // Telegram использует структуру с data-post атрибутами
      $('.tgme_widget_message').each((index, element) => {
        if (posts.length >= limit) return false;
        
        const $msg = $(element);
        const postId = $msg.attr('data-post')?.split('/').pop() || String(index);
        const text = $msg.find('.tgme_widget_message_text').text().trim();
        const dateStr = $msg.find('.tgme_widget_message_date time').attr('datetime');
        const date = dateStr ? new Date(dateStr) : new Date();
        
        if (text) {
          posts.push({
            id: parseInt(postId) || index,
            text: text,
            date: date,
            link: `https://t.me/${username}/${postId}`
          });
        }
      });
      
      // Если не нашли через cheerio, пробуем парсить JSON
      if (posts.length === 0 && jsonMatch) {
        try {
          const data = JSON.parse(jsonMatch[1]);
          // Парсим структуру данных Telegram
          const messages = data?.messages?.messages || [];
          
          for (const msg of messages.slice(0, limit)) {
            if (msg.message && msg.message.message) {
              posts.push({
                id: msg.id || posts.length,
                text: msg.message.message,
                date: new Date(msg.date * 1000),
                link: `https://t.me/${username}/${msg.id}`
              });
            }
          }
        } catch (e) {
          console.warn('[TelegramParser] Failed to parse JSON data:', e);
        }
      }
      
      // Сортируем по дате (новые первыми)
      const sortedPosts = posts
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, limit);
      
      console.log(`[TelegramParser] Web scraping found ${sortedPosts.length} posts from ${normalized}`);
      
      return sortedPosts;
    } catch (error) {
      console.error(`[TelegramParser] Web scraping failed for ${normalized}:`, error);
      throw new Error(`Web scraping failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Получить последние посты из канала через getUpdates (Bot API)
   * 
   * ОГРАНИЧЕНИЕ: Работает только если бот подписан на канал и получает новые сообщения
   */
  public static async fetchChannelPosts(
    channelUsername: string,
    limit: number = 20
  ): Promise<TelegramPost[]> {
    if (!this.isAvailable()) {
      throw new Error('TELEGRAM_BOT_TOKEN not configured');
    }

    const token = this.getBotToken()!;
    const normalized = this.normalizeChannelUsername(channelUsername);
    const username = normalized.slice(1); // Убрать @ для API
    
    console.log(`[TelegramParser] Fetching posts from ${normalized}, limit: ${limit}`);

    try {
      // Получить последние обновления от бота
      // Для получения сообщений из канала бот должен быть подписан на канал
      const response = await fetch(`${this.BOT_API_URL}${token}/getUpdates?limit=100&timeout=1`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.description || 'Failed to fetch updates');
      }

      const data = await response.json();
      
      if (!data.ok) {
        throw new Error(data.description || 'Failed to fetch updates');
      }

      const updates = data.result || [];
      
      // Фильтруем обновления от нужного канала
      const channelPosts: TelegramPost[] = [];
      
      for (const update of updates) {
        if (update.channel_post) {
          const post = update.channel_post;
          const chat = post.chat;
          
          // Проверяем что это нужный канал
          if (chat.username === username) {
            channelPosts.push({
              id: post.message_id,
              text: post.text || post.caption || '',
              date: new Date(post.date * 1000),
              link: `https://t.me/${chat.username}/${post.message_id}`
            });
          }
        }
      }

      // Сортируем по дате (новые первыми) и ограничиваем
      const sortedPosts = channelPosts
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, limit);

      console.log(`[TelegramParser] Found ${sortedPosts.length} posts from @${username}`);
      
      if (sortedPosts.length === 0) {
        console.warn(`[TelegramParser] No posts found. Make sure bot is subscribed to @${username}`);
      }
      
      return sortedPosts;
    } catch (error) {
      console.error(`[TelegramParser] Failed to fetch posts from @${username}:`, error);
      throw new Error(`Failed to fetch posts: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Парсинг канала - возвращает формат аналогичный RSS
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
    // Нормализуем username перед использованием
    const normalized = this.normalizeChannelUsername(channelUsername);
    const username = normalized.slice(1); // Убрать @ для внутреннего использования
    
    console.log(`[TelegramParser] parse() called with: "${channelUsername}" -> normalized: "${normalized}"`);
    
    try {
      // Сначала пытаемся получить информацию о канале
      let channelInfo: TelegramChannelInfo;
      try {
        channelInfo = await this.getChannelInfo(normalized);
      } catch (error) {
        // Если не удалось получить info, используем username как title
        channelInfo = {
          title: username,
          username: username,
          postsCount: 0
        };
      }

      // Получаем посты - сначала пробуем Bot API, потом Web Scraping
      let posts: TelegramPost[] = [];
      let botApiWorked = false;
      
      // Пробуем Bot API (если токен есть)
      if (this.isAvailable()) {
        try {
          posts = await this.fetchChannelPosts(normalized, 20);
          console.log(`[TelegramParser] Bot API returned ${posts.length} posts`);
          botApiWorked = true;
        } catch (error) {
          console.warn(`[TelegramParser] Bot API failed:`, error instanceof Error ? error.message : String(error));
          console.log(`[TelegramParser] Trying web scraping as fallback...`);
        }
      } else {
        console.log(`[TelegramParser] Bot API not available (no token), using web scraping...`);
      }
      
      // Если постов нет (Bot API не сработал или вернул 0), пробуем Web Scraping
      if (posts.length === 0) {
        try {
          console.log(`[TelegramParser] Fetching posts via web scraping for ${normalized}...`);
          posts = await this.fetchChannelPostsViaWebScraping(normalized, 20);
          console.log(`[TelegramParser] Web scraping returned ${posts.length} posts`);
        } catch (error) {
          console.error(`[TelegramParser] Web scraping failed:`, error instanceof Error ? error.message : String(error));
          // Не выбрасываем ошибку, просто возвращаем пустой результат
        }
      }

      // Если постов все еще нет, возвращаем пустой результат
      if (posts.length === 0) {
        console.warn(`[TelegramParser] No posts found for ${normalized} via any method`);
        return {
          title: channelInfo.title,
          description: channelInfo.description,
          items: []
        };
      }

      const items = posts.map((post) => {
        // Берем первые 100 символов как title
        const title = post.text.length > 100 
          ? post.text.substring(0, 100) + '...'
          : post.text || `Post #${post.id}`;
        
        return {
          title,
          description: post.text,
          link: post.link || `https://t.me/${username}/${post.id}`,
          pubDate: post.date,
          guid: `telegram_${username}_${post.id}`
        };
      });

      return {
        title: channelInfo.title,
        description: channelInfo.description,
        items
      };
    } catch (error) {
      console.error(`[TelegramParser] Failed to parse channel ${normalized}:`, error);
      throw error;
    }
  }
}
