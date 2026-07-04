import { Bot, Context } from 'grammy';
import prisma from '../utils/prisma';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const bot = BOT_TOKEN ? new Bot(BOT_TOKEN) : null;

if (!bot) {
  console.warn('[telegram] TELEGRAM_BOT_TOKEN not set — bot disabled');
}

// Command: /start
bot?.command('start', async (ctx: Context) => {
  await ctx.reply(
    '👋 MediaSyndicate Bot\n\n' +
    'Команды:\n' +
    '/add @username — предложить канал в рейтинг\n' +
    '/stats @username — базовая статистика канала\n' +
    '/help — справка',
  );
});

// Command: /help
bot?.command('help', async (ctx: Context) => {
  await ctx.reply(
    '📊 *MediaSyndicate Bot*\n\n' +
    'Бот для рейтинг-борда Telegram-каналов mediasyndicate.online\n\n' +
    '*Команды:*\n' +
    '`/add @username` — предложить канал\n' +
    '`/stats @username` — публичная статистика\n\n' +
    '*Для владельцев каналов:*\n' +
    'Добавьте бота в админы канала для получения точной статистики.\n' +
    'Бот использует *только чтение* постов и статистики.',
    { parse_mode: 'Markdown' },
  );
});

// Command: /add @username
bot?.command('add', async (ctx: Context) => {
  const text = ctx.message?.text || '';
  const match = text.match(/@(\w+)/);

  if (!match) {
    await ctx.reply('Укажите username канала: `/add @username`', { parse_mode: 'Markdown' });
    return;
  }

  const username = match[1];

  try {
    // Check if channel already exists
    const existing = await prisma.channel.findUnique({ where: { username } });
    if (existing) {
      await ctx.reply(`Канал @${username} уже в каталоге: https://mediasyndicate.online/channels/${existing.id}`);
      return;
    }

    // Check moderation queue
    const inQueue = await prisma.moderationQueue.findFirst({
      where: { username, status: 'pending' },
    });
    if (inQueue) {
      await ctx.reply(`Канал @${username} уже ожидает модерации.`);
      return;
    }

    // Fetch channel info from Telegram
    const chat = await ctx.api.getChat(`@${username}`).catch(() => null);

    if (!chat) {
      await ctx.reply(`Не удалось получить информацию о канале @${username}. Проверьте username.`);
      return;
    }

    const title = 'title' in chat ? (chat.title ?? username) : username;
    const description = ('description' in chat ? (chat as any).description : null) as string | null;
    const chatType = 'type' in chat ? chat.type : null;

    await prisma.moderationQueue.create({
      data: {
        username,
        title,
        description: description || null,
        type: chatType || null,
        status: 'pending',
      },
    });

    await ctx.reply(
      `✅ Канал *${title}* (@${username}) отправлен на модерацию.\n\n` +
      `После одобрения появится на https://mediasyndicate.online`,
      { parse_mode: 'Markdown' },
    );
  } catch (err) {
    console.error('[telegram] /add error:', err);
    await ctx.reply('Ошибка. Попробуйте позже.');
  }
});

// Command: /stats @username
bot?.command('stats', async (ctx: Context) => {
  const text = ctx.message?.text || '';
  const match = text.match(/@(\w+)/);

  if (!match) {
    await ctx.reply('Укажите username канала: `/stats @username`', { parse_mode: 'Markdown' });
    return;
  }

  const username = match[1];

  try {
    const chat = await ctx.api.getChat(`@${username}`).catch(() => null);

    if (!chat) {
      await ctx.reply(`Не удалось получить информацию о канале @${username}.`);
      return;
    }

    const title = 'title' in chat ? chat.title : username;
    const desc = 'description' in chat ? (chat as any).description : '';
    const memberCount = 'member_count' in chat ? (chat as any).member_count : '—';

    await ctx.reply(
      `📊 *${title}*\n` +
      `@${username}\n` +
      `👥 Подписчиков: ${memberCount}\n` +
      `${desc ? `📝 ${desc}\n` : ''}` +
      `\n🔗 https://mediasyndicate.online`,
      { parse_mode: 'Markdown' },
    );
  } catch (err) {
    console.error('[telegram] /stats error:', err);
    await ctx.reply('Ошибка получения статистики.');
  }
});

/**
 * Fetch channel stats from Telegram API.
 * Requires bot to be admin to get message reacts/comments.
 */
export async function fetchChannelStats(username: string): Promise<{
  subscribers: number;
  reactions: number;
  reposts: number;
  comments: number;
} | null> {
  if (!bot) return null;

  try {
    const chat = await bot.api.getChat(`@${username}`);
    const subscribers = 'member_count' in chat ? (chat as any).member_count : 0;

    // Try to get recent messages for engagement stats (requires admin)
    let reactions = 0;
    let reposts = 0;
    let comments = 0;

    try {
      // Attempt to get detailed stats (requires admin)
      // For now, subscriber count is all we get without admin
    } catch {
      // Bot not admin — limited stats
    }

    return { subscribers, reactions, reposts, comments };
  } catch (err) {
    console.error(`[telegram] fetchChannelStats(${username}) error:`, err);
    return null;
  }
}

/**
 * Start bot in polling mode.
 */
export function startBot(): void {
  if (!bot) return;
  bot.start({
    onStart: (info) => console.log(`[telegram] Bot @${info.username} started`),
  });
  console.log('[telegram] Bot polling started');
}

export { bot };
