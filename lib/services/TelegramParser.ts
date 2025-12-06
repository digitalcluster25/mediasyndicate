/**
 * Telegram Parser - прямой парсинг HTML с https://t.me/s/CHANNEL
 * 
 * Использует fetch + regex для парсинга HTML без зависимостей
 */
export class TelegramParser {
  /**
   * Парсинг чисел вида "3.2K", "1.5M" в обычные числа
   */
  private static parseMetricValue(value: string): number {
    const cleaned = value.trim();
    if (cleaned.endsWith('K') || cleaned.toLowerCase().endsWith('k')) {
      return Math.round(parseFloat(cleaned.replace(/[kK]/g, '')) * 1000);
    }
    if (cleaned.endsWith('M') || cleaned.toLowerCase().endsWith('m')) {
      return Math.round(parseFloat(cleaned.replace(/[mM]/g, '')) * 1000000);
    }
    return parseInt(cleaned.replace(/[^0-9]/g, '')) || 0;
  }


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
      metrics?: {
        views: number;
        forwards: number;
        reactions: number;
        replies: number;
      };
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
        boldTitle?: string;
        date: Date;
        link: string;
        views: number;
        forwards: number;
        reactions: number;
        replies: number;
      }> = [];
      
      // Ищем все сообщения в HTML
      // Telegram использует структуру с data-post атрибутами
      const messageRegex = /<div[^>]*class="tgme_widget_message[^"]*"[^>]*data-post="([^"]+)"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g;
      
      let match;
      let index = 0;
      
      while ((match = messageRegex.exec(html)) !== null && posts.length < 50) {
        const postId = match[1].split('/').pop() || String(index);
        const messageHtml = match[2];
        
        // Извлекаем полужирный текст как заголовок (если есть в начале)
        const extractBoldTitle = (html: string): string | null => {
          // Ищем <b>...</b> или <strong>...</strong> в начале текста
          const boldMatch = html.match(/<(b|strong)[^>]*>(.*?)<\/(b|strong)>/);
          if (boldMatch) {
            const boldText = boldMatch[2]
              .replace(/<[^>]+>/g, '') // убрать вложенные теги
              .replace(/&nbsp;/g, ' ')
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .trim();
            // Возвращаем только если это не весь текст (т.е. есть что-то после)
            return boldText.length > 0 && boldText.length < 500 ? boldText : null;
          }
          return null;
        };
        
        // Извлекаем текст сообщения
        const textMatch = messageHtml.match(/<div[^>]*class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/);
        const fullText = textMatch 
          ? textMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim()
          : '';
        
        // Пытаемся извлечь заголовок из полужирного текста
        const boldTitle = textMatch ? extractBoldTitle(textMatch[1]) : null;
        
        // Извлекаем дату
        const dateMatch = messageHtml.match(/<time[^>]*datetime="([^"]+)"[^>]*>/);
        const date = dateMatch ? new Date(dateMatch[1]) : new Date();
        
        // Извлекаем метрики
        // Views: ищем в tgme_widget_message_views
        const viewsMatch = messageHtml.match(/<span[^>]*class="tgme_widget_message_views[^"]*"[^>]*>([\s\S]*?)<\/span>/);
        let views = 0;
        if (viewsMatch) {
          const viewsText = viewsMatch[1].replace(/<[^>]+>/g, '').trim();
          views = this.parseMetricValue(viewsText);
        }
        
        // Forwards: ищем количество пересылок
        // Telegram показывает количество в tgme_widget_message_forwards
        let forwards = 0;
        const forwardsMatch = messageHtml.match(/<span[^>]*class="tgme_widget_message_forwards[^"]*"[^>]*>([\s\S]*?)<\/span>/);
        if (forwardsMatch) {
          const forwardsText = forwardsMatch[1].replace(/<[^>]+>/g, '').trim();
          forwards = this.parseMetricValue(forwardsText);
        } else {
          // Проверяем наличие пересылки (Forwarded from)
          const forwardedMatch = messageHtml.match(/<a[^>]*class="tgme_widget_message_forwarded_from[^"]*"[^>]*>/i);
          if (forwardedMatch) {
            forwards = 1; // Минимум 1 если есть пересылка
          }
        }
        
        // Reactions: ищем эмодзи реакции (суммируем все)
        const reactionsMatch = messageHtml.match(/<span[^>]*class="tgme_widget_message_reaction[^"]*"[^>]*>([\s\S]*?)<\/span>/g);
        let reactions = 0;
        if (reactionsMatch) {
          reactionsMatch.forEach((reaction) => {
            const reactionText = reaction.replace(/<[^>]+>/g, '').trim();
            const count = this.parseMetricValue(reactionText);
            reactions += count;
          });
        }
        
        // Replies: ищем в tgme_widget_message_reply
        const repliesMatch = messageHtml.match(/<a[^>]*class="tgme_widget_message_reply[^"]*"[^>]*>([\s\S]*?)<\/a>/);
        let replies = 0;
        if (repliesMatch) {
          const repliesText = repliesMatch[1].replace(/<[^>]+>/g, '').trim();
          const repliesNum = repliesText.match(/(\d+)/);
          if (repliesNum) {
            replies = parseInt(repliesNum[1], 10);
          }
        }
        
        if (fullText && fullText.length > 0) {
          posts.push({
            id: postId,
            text: fullText,
            boldTitle: boldTitle || undefined,
            date: date,
            link: `https://t.me/${username}/${postId}`,
            views: views,
            forwards: forwards,
            reactions: reactions,
            replies: replies
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
      
      // Преобразуем в формат RSS с метриками
      const items = sortedPosts.map((post) => {
        const titleText = post.boldTitle || (
          post.text.length > 100 
            ? post.text.substring(0, 100) + '...'
            : post.text || `Post #${post.id}`
        );
        
        return {
          title: titleText,
          description: post.text,
          link: post.link,
          pubDate: post.date,
          guid: `telegram_${username}_${post.id}`,
          // Добавляем метрики в guid для передачи в ImportService
          metrics: {
            views: post.views,
            forwards: post.forwards,
            reactions: post.reactions,
            replies: post.replies
          }
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
