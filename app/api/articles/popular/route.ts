import { NextResponse } from 'next/server';
import { RatingService } from '@/lib/services/RatingService';
import { prisma } from '@/lib/prisma';

// GET - получить популярные статьи по рейтингу
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
    try {
      // Пробуем получить через RatingService (если поля метрик существуют)
      const articles = await RatingService.getTopArticles(limit);
      return NextResponse.json({
        articles,
        count: articles.length
      });
    } catch (error: any) {
      // Если поля метрик не существуют, используем fallback
      if (error?.code === 'P2022' || error?.message?.includes('does not exist')) {
        console.warn('[API Popular] Rating fields do not exist, using publishedAt for sorting');
        const articles = await prisma.article.findMany({
          orderBy: { publishedAt: 'desc' },
          take: limit,
          include: {
            source: {
              select: {
                name: true,
                type: true
              }
            }
          }
        });
        return NextResponse.json({
          articles,
          count: articles.length
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('[API Popular Articles Error]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch popular articles' },
      { status: 500 }
    );
  }
}

