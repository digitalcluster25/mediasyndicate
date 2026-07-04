import { Router } from 'express';
import prisma from '../utils/prisma';

const router = Router();

// GET /api/stats/:channelId
router.get('/:channelId', async (req, res) => {
  try {
    const channelId = parseInt(req.params.channelId);
    const { days = '30' } = req.query;
    const since = new Date(Date.now() - parseInt(String(days)) * 24 * 60 * 60 * 1000);

    const stats = await prisma.channelStat.findMany({
      where: { channelId, recordedAt: { gte: since } },
      orderBy: { recordedAt: 'asc' },
    });

    res.json(stats);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
