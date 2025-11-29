import { NextResponse } from 'next/server';
import { RatingSnapshotService } from '@/lib/services/RatingSnapshotService';
import { HOT_THRESHOLD, NEW_THRESHOLDS } from '@/lib/constants/rating';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || 'hour') as 'online' | 'hour' | 'day';
    const limit = parseInt(searchParams.get('limit') || '50');
    const updateMetrics = searchParams.get('updateMetrics') === 'true';

    let result;
    try {
      // Добавляем таймаут для получения данных (20 секунд - меньше для быстрого ответа)
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Service timeout')), 20000)
      );
      
      result = await Promise.race([
        RatingSnapshotService.getLiveRating(period, limit, updateMetrics),
        timeoutPromise
      ]) as Awaited<ReturnType<typeof RatingSnapshotService.getLiveRating>>;
    } catch (error) {
      console.error('[Live Rating API] RatingSnapshotService error:', error);
      
      // Всегда возвращаем валидный JSON, даже при ошибке
      // Это предотвращает 502 ошибку
      return NextResponse.json({
        period,
        timestamp: Date.now(),
        lastUpdate: Date.now(),
        nextUpdate: Date.now() + 30000,
        timeUntilNextUpdate: 30000,
        articles: []
      }, { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
    }

    const { articles, lastUpdate, nextUpdate, timeUntilNextUpdate } = result;

    const thresholdMinutes = NEW_THRESHOLDS[period];

    function isNewByAge(createdAt: Date, thresholdMinutes: number): boolean {
      return (Date.now() - createdAt.getTime()) / (1000 * 60) <= thresholdMinutes;
    }

    // Безопасное маппирование с обработкой ошибок
    const mappedArticles = articles.map((a: any) => {
      try {
        return {
          id: a.id,
          title: a.title || '',
          url: a.url || '',
          sourceName: (a.source && 'name' in a.source) ? a.source.name : 'Unknown',
          rating: a.rating || 0,
          ratingDelta: a.ratingDelta || 0,
          position: a.currentPosition || 0,
          positionChange: a.positionChange || 0,
          views: a.views || 0,
          reactions: a.reactions || 0,
          forwards: a.forwards || 0,
          replies: a.replies || 0,
          isNew: a.isNew || isNewByAge(a.createdAt, thresholdMinutes),
          isHot: Math.abs(a.positionChange) >= HOT_THRESHOLD
        };
      } catch (err) {
        console.error('[Live Rating API] Error mapping article:', err, a);
        return null;
      }
    }).filter(Boolean);

    return NextResponse.json({
      period,
      timestamp: Date.now(),
      lastUpdate,
      nextUpdate,
      timeUntilNextUpdate,
      articles: mappedArticles
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('[Live Rating API] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Всегда возвращаем валидный JSON, даже при критической ошибке
    return NextResponse.json(
      { 
        period: 'hour',
        timestamp: Date.now(),
        lastUpdate: Date.now(),
        nextUpdate: Date.now() + 30000,
        timeUntilNextUpdate: 30000,
        articles: [],
        error: 'Failed to fetch',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      }, 
      { 
        status: 200, // 200 вместо 500, чтобы не вызывать 502
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }
    );
  }
}

