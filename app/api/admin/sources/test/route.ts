import { NextResponse } from 'next/server';
// import { getSession } from '@/lib/auth/session'; // ЗАКОММЕНТИРОВАНО
import { RSSParser } from '@/lib/services/RSSParser';
// Lazy import для TelegramParser
import { z } from 'zod';

export async function POST(request: Request) {
  // АВТОРИЗАЦИЯ ОТКЛЮЧЕНА ДЛЯ РАЗРАБОТКИ
  // const session = await getSession();
  // if (!session) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  const body = await request.json();
  
  // Валидация - теперь принимает URL или Telegram username
  const schema = z.object({
    url: z.string(),
    type: z.enum(['RSS', 'TELEGRAM']).optional()
  });

  const validation = schema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid input'
      },
      { status: 400 }
    );
  }

  const { url, type } = validation.data;
  
  // Определяем тип по URL или используем переданный тип
  const sourceType = type || (url.startsWith('@') || url.startsWith('https://t.me/') ? 'TELEGRAM' : 'RSS');

  try {
    let feed: { items: any[]; title?: string };
    
    if (sourceType === 'TELEGRAM') {
      // Для Telegram извлекаем username из URL
      let username = url;
      if (url.startsWith('https://t.me/')) {
        username = '@' + url.replace('https://t.me/', '').split('/')[0];
      } else if (!url.startsWith('@')) {
        username = '@' + url;
      }
      
      // Lazy load TelegramParser
      const { TelegramParser } = await import('@/lib/services/TelegramParser');
      feed = await TelegramParser.parse(username);
    } else {
      // RSS парсинг
      feed = await RSSParser.parse(url);
    }
    
    if (!feed.items || feed.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Feed is empty',
          details: 'No items found in the feed'
        },
        { status: 400 }
      );
    }

    // Взять первую статью как пример
    const sample = feed.items[0];

    return NextResponse.json({
      success: true,
      itemsFound: feed.items.length,
      sample: {
        title: sample.title,
        pubDate: sample.pubDate,
        link: sample.link
      }
    });
  } catch (error) {
    console.error('[RSS Test Error]:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to parse RSS feed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 400 }
    );
  }
}

