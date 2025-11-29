import { NextResponse } from 'next/server';
import { RatingService } from '@/lib/services/RatingService';

/**
 * Инициализация позиций для всех статей
 * Запустить один раз после деплоя
 */
export async function GET() {
  try {
    // Шаг 1: Первый пересчёт - устанавливает currentPosition
    await RatingService.recalculateWithDynamics();
    
    // Шаг 2: Второй пересчёт - теперь positionChange будет работать
    const result = await RatingService.recalculateWithDynamics();
    
    return NextResponse.json({
      success: true,
      message: 'Positions initialized',
      ...result
    });
  } catch (error) {
    console.error('[Rating Init] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to initialize positions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

