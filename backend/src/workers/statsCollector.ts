import prisma from '../utils/prisma';

/**
 * Daily cron job: fetch stats from Telegram API and compute engagement scores.
 * Runs via node-cron in production or manual trigger in dev.
 */
export async function collectDailyStats(): Promise<void> {
  console.log('[worker] Starting daily stats collection...');

  const channels = await prisma.channel.findMany({
    where: { status: 'approved' },
    select: { id: true, username: true },
  });

  let processed = 0;
  let errors = 0;

  for (const channel of channels) {
    try {
      const prevStats = await prisma.channelStat.findFirst({
        where: { channelId: channel.id },
        orderBy: { recordedAt: 'desc' },
      });

      // In production, replace this with actual Telegram API calls:
      // const tgStats = await fetchChannelStats(channel.username);
      // For now, use placeholder with 0 values — real data from Telegram API
      const subscribers = 0; // tgStats.subscribers
      const reactions = 0;   // tgStats.reactions (last 24h)
      const reposts = 0;     // tgStats.reposts (last 24h)
      const comments = 0;    // tgStats.comments (last 24h)

      // Engagement score formula: reactions * 0.1 + reposts * 1 + comments * 2
      const engagementScore = reactions * 0.1 + reposts * 1 + comments * 2;

      // Growth rate (%): (current - prev) / prev * 100
      const growthRate = prevStats && prevStats.subscribers > 0
        ? ((subscribers - prevStats.subscribers) / prevStats.subscribers) * 100
        : 0;

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
    } catch (error) {
      console.error(`[worker] Error processing channel ${channel.username}:`, error);
      errors++;
    }
  }

  console.log(`[worker] Completed: ${processed} channels processed, ${errors} errors`);
}

/**
 * Update composite ranking for all channels after stats collection.
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
