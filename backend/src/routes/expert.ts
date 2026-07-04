import { Router } from 'express';
import prisma from '../utils/prisma';
import { expertRatingSchema } from '../types';

const router = Router();

// POST /api/expert-rating
router.post('/', async (req, res) => {
  try {
    const { channelId, rating, comment } = expertRatingSchema.parse(req.body);

    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) return res.status(404).json({ error: 'Channel not found' });

    const expertRating = await prisma.expertRating.create({
      data: { channelId, rating, comment },
    });

    // Update channel's cached score
    const avgRating = await prisma.expertRating.aggregate({
      where: { channelId },
      _avg: { rating: true },
    });

    await prisma.channel.update({
      where: { id: channelId },
      data: { totalScore: avgRating._avg.rating || 0 },
    });

    res.status(201).json(expertRating);
  } catch {
    res.status(400).json({ error: 'Invalid input' });
  }
});

export default router;
