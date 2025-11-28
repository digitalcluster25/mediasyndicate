/**
 * Telegram Parser - прямой парсинг HTML с https://t.me/s/CHANNEL
 * 
 * Использует fetch + regex для парсинга HTML без зависимостей
 */
export class TelegramParser {


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
   * Парсинг канала через прямой HTML парсинг с https://t.me/s/CHANNEL
   * Использует fetch + regex для извлечения постов
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
      // Формируем URL для парсинга
      const url = `https://t.me/s/${username}`;
      console.log(`[TelegramParser] Fetching HTML from: ${url}`);
      
      // Загружаем HTML страницу
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch channel page: ${response.status}`);
      }
      
      const html = await response.text();
      
      // Парсим посты через regex
      const posts: Array<{
        id: string;
        text: string;
        date: Date;
        link: string;
      }> = [];
      
      // Ищем все сообщения в HTML
      // Telegram использует структуру с data-post атрибутами
      const messageRegex = /<div[^>]*class="tgme_widget_message[^"]*"[^>]*data-post="([^"]+)"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g;
      
      let match;
      let index = 0;
      
      while ((match = messageRegex.exec(html)) !== null && posts.length < 50) {
        const postId = match[1].split('/').pop() || String(index);
        const messageHtml = match[2];
        
        // Извлекаем текст сообщения
        const textMatch = messageHtml.match(/<div[^>]*class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/);
        const text = textMatch 
          ? textMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim()
          : '';
        
        // Извлекаем дату
        const dateMatch = messageHtml.match(/<time[^>]*datetime="([^"]+)"[^>]*>/);
        const date = dateMatch ? new Date(dateMatch[1]) : new Date();
        
        if (text && text.length > 0) {
          posts.push({
            id: postId,
            text: text,
            date: date,
            link: `https://t.me/${username}/${postId}`
          });
        }
        
        index++;
      }
      
      // Сортируем по дате (новые первыми)
      const sortedPosts = posts
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 20);
      
      console.log(`[TelegramParser] Found ${sortedPosts.length} posts from ${username}`);
      
      // Извлекаем название канала
      const titleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/);
      const title = titleMatch ? titleMatch[1] : `Telegram: ${username}`;
      
      // Преобразуем в формат RSS
      const items = sortedPosts.map((post) => {
        const titleText = post.text.length > 100 
          ? post.text.substring(0, 100) + '...'
          : post.text || `Post #${post.id}`;
        
        return {
          title: titleText,
          description: post.text,
          link: post.link,
          pubDate: post.date,
          guid: `telegram_${username}_${post.id}`
        };
      });
      
      return {
        title: title,
        description: undefined,
        items
      };
    } catch (error) {
      console.error(`[TelegramParser] Failed to parse channel ${username}:`, error);
      throw new Error(`Telegram parsing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
