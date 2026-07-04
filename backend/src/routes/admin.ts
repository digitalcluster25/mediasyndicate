import { Router } from 'express';
import prisma from '../utils/prisma';
import { moderationSchema } from '../types';

const router = Router();

// GET /api/admin/queue — moderation queue
router.get('/queue', async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const queue = await prisma.moderationQueue.findMany({
      where: { status: String(status) },
      orderBy: { createdAt: 'desc' },
    });
    res.json(queue);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/moderate/:id — approve/reject
router.post('/moderate/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, reviewedBy } = moderationSchema.parse({ id, ...req.body });

    const entry = await prisma.moderationQueue.findUnique({ where: { id } });
    if (!entry) return res.status(404).json({ error: 'Entry not found' });

    await prisma.moderationQueue.update({
      where: { id },
      data: { status, reviewedBy: reviewedBy || 'admin', reviewedAt: new Date() },
    });

    if (status === 'approved') {
      await prisma.channel.create({
        data: {
          telegramId: entry.telegramId,
          username: entry.username,
          title: entry.title,
          description: entry.description,
          categoryId: entry.categoryId,
          status: 'approved',
        },
      });
    }

    res.json({ message: `Channel ${status}` });
  } catch {
    res.status(400).json({ error: 'Invalid input' });
  }
});

// PUT /api/admin/channels/:id — update channel
router.put('/channels/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, description, categoryId, country, language, imageUrl, status } = req.body;

    const channel = await prisma.channel.update({
      where: { id },
      data: { title, description, categoryId, country, language, imageUrl, status },
    });

    res.json(channel);
  } catch {
    res.status(400).json({ error: 'Invalid input or channel not found' });
  }
});

// DELETE /api/admin/channels/:id
router.delete('/channels/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.channel.delete({ where: { id } });
    res.json({ message: 'Channel deleted' });
  } catch {
    res.status(404).json({ error: 'Channel not found' });
  }
});

export default router;
