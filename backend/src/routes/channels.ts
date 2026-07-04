import { Router } from 'express';
import prisma from '../utils/prisma';
import { addChannelSchema, channelQuerySchema } from '../types';
import { Prisma } from '@prisma/client';

const router = Router();

// GET /api/channels — paginated, filterable list
router.get('/', async (req, res) => {
  try {
    const query = channelQuerySchema.parse(req.query);
    const { page, limit, categoryId, country, language, search, sort, order } = query;

    const where: Prisma.ChannelWhereInput = {
      status: 'approved',
      ...(categoryId && { categoryId }),
      ...(country && { country }),
      ...(language && { language }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [channels, total] = await Promise.all([
      prisma.channel.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          stats: { orderBy: { recordedAt: 'desc' }, take: 1 },
        },
        orderBy: { [sort]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.channel.count({ where }),
    ]);

    res.json({
      data: channels.map((c) => ({
        ...c,
        latestStats: c.stats[0] || null,
        stats: undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientValidationError) {
      res.status(400).json({ error: 'Invalid query parameters' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// GET /api/channels/:id
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const channel = await prisma.channel.findUnique({
      where: { id },
      include: {
        category: true,
        stats: { orderBy: { recordedAt: 'desc' }, take: 30 },
        expertRatings: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });

    if (!channel || channel.status !== 'approved') {
      return res.status(404).json({ error: 'Channel not found' });
    }

    const avgExpertRating = await prisma.expertRating.aggregate({
      where: { channelId: id },
      _avg: { rating: true },
      _count: true,
    });

    res.json({ ...channel, expertRatingAvg: avgExpertRating._avg.rating || null, expertRatingCount: avgExpertRating._count });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/channels — add channel → moderation queue
router.post('/', async (req, res) => {
  try {
    const data = addChannelSchema.parse(req.body);

    const existing = await prisma.channel.findUnique({ where: { username: data.username } });
    if (existing) {
      return res.status(409).json({ error: 'Channel already exists' });
    }

    const entry = await prisma.moderationQueue.create({
      data: {
        telegramId: data.telegramId ? BigInt(data.telegramId) : null,
        username: data.username,
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        status: 'pending',
      },
    });

    res.status(201).json({ message: 'Channel submitted for moderation', id: entry.id });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      res.status(409).json({ error: 'Channel already exists' });
    } else {
      res.status(400).json({ error: 'Invalid input' });
    }
  }
});

export default router;
