import { NextResponse } from 'next/server';
import { TelegramMetricsUpdateService } from '@/lib/services/TelegramMetricsUpdateService';

/**
 * Cron endpoint для обновления метрик из Telegram (каждые 30 секунд)
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

    console.log('[Cron Metrics Update] Starting metrics update from Telegram...');
    
    const result = await TelegramMetricsUpdateService.updateAllMetrics();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result
    });
  } catch (error) {
    console.error('[Cron Metrics Update Error]:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

