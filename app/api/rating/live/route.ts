import { NextResponse } from 'next/server';
import { RatingService } from '@/lib/services/RatingService';
import { HOT_THRESHOLD, NEW_THRESHOLDS } from '@/lib/constants/rating';

/**
 * GET /api/rating/live?period=online|hour|day
 * 
 * Возвращает рейтинг с динамическими данными для фронтенда
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || 'hour') as 'online' | 'hour' | 'day';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Получить статьи с динамикой
    const articles = await RatingService.getTrendingWithDynamics(limit);

    // Функция для определения "новой" статьи
    const isNew = (firstSeenAt: Date, period: 'online' | 'hour' | 'day'): boolean => {
      const thresholdMinutes = NEW_THRESHOLDS[period];
      const ageMinutes = (Date.now() - firstSeenAt.getTime()) / (1000 * 60);
      return ageMinutes <= thresholdMinutes;
    };

    return NextResponse.json({
      period,
      timestamp: Date.now(),
      articles: articles.map(a => ({
        id: a.id,
        title: a.title,
        url: a.url,
        sourceName: a.source.name,
        rating: a.rating,
        ratingDelta: a.ratingDelta,
        position: a.currentPosition,
        positionChange: a.positionChange, // + = вверх, - = вниз
        views: a.views,
        reactions: a.reactions,
        forwards: a.forwards,
        replies: a.replies,
        isNew: isNew(a.firstSeenAt, period),
        isHot: Math.abs(a.positionChange) >= HOT_THRESHOLD
      }))
    });
  } catch (error) {
    console.error('[Live Rating API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch live rating' },
      { status: 500 }
    );
  }
}

