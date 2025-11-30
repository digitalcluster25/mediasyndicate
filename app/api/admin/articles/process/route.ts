import { NextResponse } from 'next/server';
import { ArticleProcessingService } from '@/lib/services/ArticleProcessingService';
import { ClusterService } from '@/lib/services/ClusterService';
import { RelatedArticlesService } from '@/lib/services/RelatedArticlesService';

/**
 * POST /api/admin/articles/process
 * Обрабатывает статьи: фильтрация, самари, заголовки, кластеры, связи
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { articleId, limit = 50 } = body;

    if (articleId) {
      // Обработка одной статьи
      const result = await ArticleProcessingService.processArticle(articleId);
      return NextResponse.json({
        success: true,
        result
      });
    } else {
      // Обработка всех необработанных статей
      const processingResult = await ArticleProcessingService.processPendingArticles(limit);
      
      // Создание кластеров
      const clusterResult = await ClusterService.createClusters(limit);
      
      // Создание связей
      const relatedResult = await RelatedArticlesService.processAllArticles(limit);

      return NextResponse.json({
        success: true,
        processing: processingResult,
        clusters: clusterResult,
        related: relatedResult
      });
    }
  } catch (error) {
    console.error('[API Articles Process Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

