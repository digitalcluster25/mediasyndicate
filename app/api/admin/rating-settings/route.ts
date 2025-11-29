import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/rating-settings
 * Получить настройки рейтинга
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Получить или создать настройки по умолчанию
    let settings = await prisma.ratingSettings.findUnique({
      where: { key: 'default' }
    });

    if (!settings) {
      // Создать настройки по умолчанию
      settings = await prisma.ratingSettings.create({
        data: {
          key: 'default',
          name: 'Rating Formula Settings',
          viewsWeight: 0.05,
          forwardsWeight: 8.0,
          reactionsWeight: 3.0,
          repliesWeight: 5.0,
          agePenalty: 2.0,
          minRating: 0,
          description: 'Default rating formula settings'
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('[Rating Settings API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rating settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/rating-settings
 * Обновить настройки рейтинга
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      viewsWeight,
      forwardsWeight,
      reactionsWeight,
      repliesWeight,
      agePenalty,
      minRating,
      maxAgeHours,
      description
    } = body;

    // Валидация
    if (
      typeof viewsWeight !== 'number' ||
      typeof forwardsWeight !== 'number' ||
      typeof reactionsWeight !== 'number' ||
      typeof repliesWeight !== 'number' ||
      typeof agePenalty !== 'number'
    ) {
      return NextResponse.json(
        { error: 'Invalid weight values' },
        { status: 400 }
      );
    }

    // Обновить или создать настройки
    const settings = await prisma.ratingSettings.upsert({
      where: { key: 'default' },
      update: {
        viewsWeight,
        forwardsWeight,
        reactionsWeight,
        repliesWeight,
        agePenalty,
        minRating: minRating ?? null,
        maxAgeHours: maxAgeHours ?? null,
        description: description ?? null,
        updatedBy: session.username,
        updatedAt: new Date()
      },
      create: {
        key: 'default',
        name: 'Rating Formula Settings',
        viewsWeight,
        forwardsWeight,
        reactionsWeight,
        repliesWeight,
        agePenalty,
        minRating: minRating ?? null,
        maxAgeHours: maxAgeHours ?? null,
        description: description ?? null,
        updatedBy: session.username
      }
    });

    // Сбросить кэш в RatingService
    const { RatingService } = await import('@/lib/services/RatingService');
    RatingService.clearSettingsCache();

    return NextResponse.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('[Rating Settings API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update rating settings' },
      { status: 500 }
    );
  }
}

