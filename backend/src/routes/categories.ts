import { Router } from 'express';
import prisma from '../utils/prisma';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { channels: true } } },
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
