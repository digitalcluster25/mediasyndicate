import { Router } from 'express';
import prisma from '../utils/prisma';
import { channelQuerySchema } from '../types';

const router = Router();

// GET /api/ranking — composite weighted ranking
router.get('/', async (req, res) => {
  try {
    const query = channelQuerySchema.parse(req.query);
    const { page, limit, categoryId, country, language } = query;

    const where: Record<string, unknown> = { status: 'approved' };
    if (categoryId) where.categoryId = categoryId;
    if (country) where.country = country;
    if (language) where.language = language;

    const channels = await prisma.channel.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        stats: { orderBy: { recordedAt: 'desc' }, take: 1 },
        expertRatings: { select: { rating: true } },
      },
      orderBy: { totalScore: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.channel.count({ where });

    // Calculate composite score inline
    const data = channels.map((c) => {
      const latest = c.stats[0];
      if (!latest) return { ...c, stats: undefined, latestStats: null, compositeScore: 0 };

      // Subscribers normalized (log scale to handle huge variance)
      const subScore = Math.log10(Math.max(latest.subscribers, 1)) * 10;
      const engagementScore = latest.engagementScore * 2;
      const growthScore = Math.max(latest.growthRate, -50);
      const expertScore =
        c.expertRatings && c.expertRatings.length > 0
          ? c.expertRatings.reduce((s, r) => s + r.rating, 0) / c.expertRatings.length / 5 * 100
          : 0;

      const compositeScore = subScore * 0.3 + engagementScore * 0.35 + Math.max(growthScore, 0) * 0.15 + expertScore * 0.2;

      return {
        id: c.id,
        telegramId: c.telegramId,
        username: c.username,
        title: c.title,
        description: c.description,
        imageUrl: c.imageUrl,
        type: c.type,
        category: c.category,
        country: c.country,
        language: c.language,
        latestStats: {
          subscribers: latest.subscribers,
          engagementScore: latest.engagementScore,
          growthRate: latest.growthRate,
          recordedAt: latest.recordedAt,
        },
        compositeScore: Math.round(compositeScore * 100) / 100,
        totalScore: c.totalScore,
      };
    });

    res.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
