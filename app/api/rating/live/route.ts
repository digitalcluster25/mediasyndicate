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
      result = await RatingSnapshotService.getLiveRating(period, limit, updateMetrics);
    } catch (error) {
      console.error('[Live Rating API] RatingSnapshotService error:', error);
      // Возвращаем пустой результат вместо ошибки
      return NextResponse.json({
        period,
        timestamp: Date.now(),
        lastUpdate: Date.now(),
        nextUpdate: Date.now() + 30000,
        timeUntilNextUpdate: 30000,
        articles: []
      });
    }

    const { articles, lastUpdate, nextUpdate, timeUntilNextUpdate } = result;

    const thresholdMinutes = NEW_THRESHOLDS[period];

    function isNewByAge(createdAt: Date, thresholdMinutes: number): boolean {
      return (Date.now() - createdAt.getTime()) / (1000 * 60) <= thresholdMinutes;
    }

    return NextResponse.json({
      period,
      timestamp: Date.now(),
      lastUpdate,
      nextUpdate,
      timeUntilNextUpdate,
      articles: articles.map(a => ({
        id: a.id,
        title: a.title,
        url: a.url,
        sourceName: a.source.name,
        rating: a.rating,
        ratingDelta: a.ratingDelta,
        position: a.currentPosition,
        positionChange: a.positionChange,
        views: a.views,
        reactions: a.reactions,
        forwards: a.forwards,
        replies: a.replies,
        isNew: a.isNew || isNewByAge(a.createdAt, thresholdMinutes),
        isHot: Math.abs(a.positionChange) >= HOT_THRESHOLD
      }))
    });
  } catch (error) {
    console.error('[Live Rating API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to fetch',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      }, 
      { status: 500 }
    );
  }
}

