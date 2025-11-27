import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { RSSParser } from '@/lib/services/RSSParser';
import { z } from 'zod';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  
  // Валидация
  const schema = z.object({
    url: z.string().url()
  });

  const validation = schema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid URL'
      },
      { status: 400 }
    );
  }

  try {
    // Парсить RSS
    const feed = await RSSParser.parse(validation.data.url);
    
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

