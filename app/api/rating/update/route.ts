import { NextResponse } from 'next/server';
import { RatingService } from '@/lib/services/RatingService';

export async function POST(request: Request) {
  try {
    const result = await RatingService.recalculateAllRatings(168);
    
    return NextResponse.json({
      success: true,
      articlesUpdated: result.updated,
      errors: result.errors,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Rating Update] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update ratings' },
      { status: 500 }
    );
  }
}

