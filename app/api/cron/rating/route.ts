import { NextResponse } from 'next/server';
import { RatingService } from '@/lib/services/RatingService';

/**
 * Cron endpoint для пересчёта рейтинга (каждый час)
 * 
 * Защита: можно добавить секретный ключ в headers
 */
export async function GET(request: Request) {
  try {
    // Опциональная проверка секретного ключа
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Cron Rating] Starting hourly rating recalculation with dynamics...');
    
    const result = await RatingService.recalculateWithDynamics();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      updated: result.updated,
      errors: result.errors,
      newInTop: result.newInTop,
      movedUp: result.movedUp,
      movedDown: result.movedDown
    });
  } catch (error) {
    console.error('[Cron Rating Error]:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to recalculate ratings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

