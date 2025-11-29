import { NextResponse } from 'next/server';
import { RatingService } from '@/lib/services/RatingService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const articles = await RatingService.getTrending(limit);

    return NextResponse.json({
      articles,
      count: articles.length
    });
  } catch (error) {
    console.error('[Trending API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending articles' },
      { status: 500 }
    );
  }
}

