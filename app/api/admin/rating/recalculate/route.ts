import { NextResponse } from 'next/server';
import { RatingService } from '@/lib/services/RatingService';

// POST - пересчитать рейтинг для всех статей
export async function POST() {
  try {
    const result = await RatingService.recalculateAllRatings();
    
    return NextResponse.json({
      success: true,
      updated: result.updated,
      errors: result.errors
    });
  } catch (error) {
    console.error('[API Rating Recalculate Error]:', error);
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


