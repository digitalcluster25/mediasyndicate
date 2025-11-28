import { NextResponse } from 'next/server';
import { RatingService } from '@/lib/services/RatingService';

// GET - получить популярные статьи по рейтингу
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
    const articles = await RatingService.getTopArticles(limit);
    
    return NextResponse.json({
      articles,
      count: articles.length
    });
  } catch (error) {
    console.error('[API Popular Articles Error]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch popular articles' },
      { status: 500 }
    );
  }
}

