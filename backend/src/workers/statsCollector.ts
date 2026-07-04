import prisma from '../utils/prisma';
import { fetchChannelStats } from '../services/telegram';

/**
 * Daily cron job: fetch stats from Telegram API and compute engagement scores.
 */
export async function collectDailyStats(): Promise<void> {
  console.log('[worker] Starting daily stats collection...');

  const channels = await prisma.channel.findMany({
    where: { status: 'approved' },
    select: { id: true, username: true },
  });

  let processed = 0;
  let errors = 0;
  let hasAdminAccess = 0;

  for (const channel of channels) {
    try {
      const prevStats = await prisma.channelStat.findFirst({
        where: { channelId: channel.id },
        orderBy: { recordedAt: 'desc' },
      });

      const tgStats = await fetchChannelStats(channel.username);

      if (!tgStats) {
        errors++;
        continue;
      }

      const { subscribers, reactions, reposts, comments } = tgStats;

      // Engagement score formula: reactions * 0.1 + reposts * 1 + comments * 2
      const engagementScore = reactions * 0.1 + reposts * 1 + comments * 2;

      // Growth rate (%): (current - prev) / prev * 100
      const growthRate = prevStats && prevStats.subscribers > 0
        ? ((subscribers - prevStats.subscribers) / prevStats.subscribers) * 100
        : 0;

      // Track if we got real data beyond subscribers
      if (reactions > 0 || reposts > 0 || comments > 0) hasAdminAccess++;

      await prisma.channelStat.create({
        data: {
          channelId: channel.id,
          subscribers,
          reactions,
          reposts,
          comments,
          engagementScore,
          growthRate,
        },
      });

      processed++;
    } catch (err) {
      console.error(`[worker] Error processing @${channel.username}:`, err);
      errors++;
    }
  }

  console.log(`[worker] Stats collected: ${processed} channels, ${errors} errors, ${hasAdminAccess} with admin access`);
}

/**
 * Update composite ranking after stats collection.
 */
export async function recalculateRankings(): Promise<void> {
  console.log('[worker] Recalculating rankings...');

  const channels = await prisma.channel.findMany({
    where: { status: 'approved' },
    select: { id: true },
  });

  for (const { id } of channels) {
    const latestStats = await prisma.channelStat.findFirst({
      where: { channelId: id },
      orderBy: { recordedAt: 'desc' },
    });

    const avgRating = await prisma.expertRating.aggregate({
      where: { channelId: id },
      _avg: { rating: true },
    });

    if (!latestStats) continue;

    const subScore = Math.log10(Math.max(latestStats.subscribers, 1)) * 10;
    const engagementScore = latestStats.engagementScore * 2;
    const growthScore = Math.max(latestStats.growthRate, 0);
    const expertScore = ((avgRating._avg.rating || 0) / 5) * 100;

    const totalScore = subScore * 0.3 + engagementScore * 0.35 + growthScore * 0.15 + expertScore * 0.2;

    await prisma.channel.update({
      where: { id },
      data: { totalScore },
    });
  }

  console.log('[worker] Rankings recalculated');
}
