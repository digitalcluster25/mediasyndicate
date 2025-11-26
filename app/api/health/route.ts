import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [sourcesCount, articlesCount] = await Promise.all([
      prisma.source.count(),
      prisma.article.count(),
    ]);

    return NextResponse.json({
      status: 'ok',
      stats: {
        sources: sourcesCount,
        articles: articlesCount,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
