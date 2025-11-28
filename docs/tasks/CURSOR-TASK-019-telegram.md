# CURSOR: TELEGRAM ПАРСИНГ ЧЕРЕЗ TELETHON

## ЦЕЛЬ
Добавить возможность парсить посты из Telegram каналов как источники новостей.

## АРХИТЕКТУРА

### Тип источника
```typescript
type Source = {
  type: 'RSS' | 'TELEGRAM'  // Добавить TELEGRAM
  url: string  // Для Telegram: @channel_username или t.me/channel
}
```

### Поток данных
```
Telegram канал → Telethon → Posts → AI фильтр → Articles → БД
```

## ЗАДАЧИ

---

## ФАЗА 1: TELETHON SETUP (только на VPS!)

### ⚠️ КРИТИЧНО!
**Telethon НЕЛЬЗЯ запускать локально!** Telegram банит аккаунты при входе с разных IP.
Вся разработка и тесты - ТОЛЬКО на production VPS (31.172.75.175).

### 1.1 Установить зависимости

**На VPS через SSH:**
```bash
ssh root@31.172.75.175
cd /app  # внутри контейнера
pip install telethon --break-system-packages
```

**ИЛИ добавить в package.json:**
```json
{
  "dependencies": {
    "telethon": "^1.x.x"  // Проверь актуальную версию
  }
}
```

### 1.2 Получить API credentials

1. Открой https://my.telegram.org/apps
2. Создай приложение
3. Получи:
   - `api_id` (number)
   - `api_hash` (string)

### 1.3 Добавить в Dokploy env vars

```bash
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash
TELEGRAM_PHONE=+380XXXXXXXXX  # Телефон для первичной авторизации
```

---

## ФАЗА 2: TELEGRAM SERVICE

### Создать `lib/telegram/client.ts`

```typescript
import { TelegramClient } from 'telethon';
import { StringSession } from 'telethon/sessions';

const apiId = parseInt(process.env.TELEGRAM_API_ID || '0');
const apiHash = process.env.TELEGRAM_API_HASH || '';
const stringSession = new StringSession(process.env.TELEGRAM_SESSION || '');

let client: TelegramClient | null = null;

export async function getTelegramClient() {
  if (client && client.connected) {
    return client;
  }

  client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => process.env.TELEGRAM_PHONE || '',
    password: async () => process.env.TELEGRAM_PASSWORD || '',
    phoneCode: async () => {
      // Для первого запуска - нужно будет вручную ввести код
      throw new Error('Phone code required - run setup script first');
    },
    onError: (err) => console.error('Telegram auth error:', err),
  });

  // Сохранить сессию для следующих запусков
  console.log('Session string:', client.session.save());
  
  return client;
}

export async function disconnectTelegram() {
  if (client) {
    await client.disconnect();
    client = null;
  }
}
```

### Создать `lib/telegram/parser.ts`

```typescript
import { getTelegramClient } from './client';
import { Api } from 'telethon';

export interface TelegramPost {
  id: number;
  text: string;
  date: Date;
  views?: number;
  media?: {
    type: 'photo' | 'video' | 'document';
    url?: string;
  };
}

export async function fetchChannelPosts(
  channelUsername: string,
  limit: number = 10
): Promise<TelegramPost[]> {
  const client = await getTelegramClient();
  
  // Убрать @ если есть
  const username = channelUsername.replace('@', '');
  
  // Получить канал
  const channel = await client.getEntity(username);
  
  // Получить последние посты
  const messages = await client.getMessages(channel, { limit });
  
  return messages.map(msg => ({
    id: msg.id,
    text: msg.text || '',
    date: new Date(msg.date * 1000),
    views: msg.views,
    media: msg.media ? {
      type: getMediaType(msg.media),
      url: undefined // TODO: обработка медиа
    } : undefined
  }));
}

function getMediaType(media: any): 'photo' | 'video' | 'document' {
  if (media.className === 'MessageMediaPhoto') return 'photo';
  if (media.className === 'MessageMediaDocument') {
    // Проверить mime type для video
    return 'document';
  }
  return 'document';
}

export async function testChannelAccess(channelUsername: string): Promise<boolean> {
  try {
    const posts = await fetchChannelPosts(channelUsername, 1);
    return posts.length > 0;
  } catch (error) {
    console.error('Channel access test failed:', error);
    return false;
  }
}
```

---

## ФАЗА 3: ИНТЕГРАЦИЯ В АДМИНКУ

### 3.1 Обновить форму добавления источника

**app/adminko/sources/components/SourceForm.tsx:**

```typescript
// Добавить в enum
const sourceTypes = ['RSS', 'TELEGRAM'] as const;

// В форме
<select name="type">
  <option value="RSS">RSS Feed</option>
  <option value="TELEGRAM">Telegram Channel</option>
</select>

// Поле URL placeholder
{type === 'TELEGRAM' ? (
  <input 
    placeholder="@channel_username или t.me/channel" 
    name="url"
  />
) : (
  <input 
    placeholder="https://example.com/rss" 
    name="url"
  />
)}
```

### 3.2 API для теста Telegram

**app/api/admin/sources/test/route.ts:**

```typescript
import { testChannelAccess } from '@/lib/telegram/parser';

export async function POST(request: NextRequest) {
  const { url, type } = await request.json();
  
  if (type === 'TELEGRAM') {
    const isValid = await testChannelAccess(url);
    return NextResponse.json({
      valid: isValid,
      message: isValid 
        ? 'Telegram channel accessible' 
        : 'Cannot access channel'
    });
  }
  
  // Существующая логика для RSS
  // ...
}
```

---

## ФАЗА 4: ИМПОРТ ПОСТОВ

### Создать `lib/telegram/importer.ts`

```typescript
import { fetchChannelPosts } from './parser';
import { filterAndRewrite } from '@/lib/ai/filter';
import { prisma } from '@/lib/prisma';

export async function importFromTelegram(sourceId: string) {
  const source = await prisma.source.findUnique({
    where: { id: sourceId }
  });
  
  if (!source || source.type !== 'TELEGRAM') {
    throw new Error('Invalid source');
  }
  
  // Получить посты
  const posts = await fetchChannelPosts(source.url, 50);
  
  // Обработать каждый пост
  for (const post of posts) {
    // Проверить дубликат (по ID поста)
    const existing = await prisma.article.findFirst({
      where: {
        sourceId,
        externalId: `telegram_${post.id}`
      }
    });
    
    if (existing) continue;
    
    // AI фильтр
    const aiResult = await filterAndRewrite(
      post.text,
      source.url,
      'TELEGRAM'
    );
    
    if (!aiResult.isRelevant) continue;
    
    // Создать статью
    await prisma.article.create({
      data: {
        sourceId,
        externalId: `telegram_${post.id}`,
        title: extractTitle(post.text), // Первые 100 символов
        content: post.text,
        contentRewritten: aiResult.rewrittenContent,
        url: `https://t.me/${source.url.replace('@', '')}/${post.id}`,
        publishedAt: post.date,
        category: aiResult.category,
        language: aiResult.language || 'uk'
      }
    });
  }
}

function extractTitle(text: string): string {
  const firstLine = text.split('\n')[0];
  return firstLine.substring(0, 100);
}
```

### Обновить API импорта

**app/api/admin/sources/[id]/import/route.ts:**

```typescript
import { importFromRSS } from '@/lib/rss/importer';
import { importFromTelegram } from '@/lib/telegram/importer';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const source = await prisma.source.findUnique({
    where: { id: params.id }
  });
  
  if (!source) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  
  try {
    if (source.type === 'RSS') {
      await importFromRSS(source.id);
    } else if (source.type === 'TELEGRAM') {
      await importFromTelegram(source.id);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Import failed:', error);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}
```

---

## ФАЗА 5: АВТОМАТИЗАЦИЯ (CRON)

### Обновить `lib/cron/import-sources.ts`

```typescript
// Добавить поддержку Telegram
for (const source of activeSources) {
  if (source.type === 'RSS') {
    await importFromRSS(source.id);
  } else if (source.type === 'TELEGRAM') {
    await importFromTelegram(source.id);
  }
}
```

---

## SETUP SCRIPT (ЗАПУСТИТЬ ОДИН РАЗ НА VPS)

### Создать `scripts/telegram-setup.ts`

```typescript
import { TelegramClient } from 'telethon';
import { StringSession } from 'telethon/sessions';
import * as readline from 'readline';

const apiId = parseInt(process.env.TELEGRAM_API_ID!);
const apiHash = process.env.TELEGRAM_API_HASH!;
const stringSession = new StringSession('');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt: string): Promise<string> => {
  return new Promise(resolve => rl.question(prompt, resolve));
};

async function setup() {
  console.log('Telegram Setup - First Time Authorization');
  
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => await question('Phone number: '),
    password: async () => await question('2FA password (if set): '),
    phoneCode: async () => await question('Telegram code: '),
    onError: (err) => console.error(err),
  });

  console.log('\n✅ Authorization successful!');
  console.log('\n📋 Add this to Dokploy environment variables:');
  console.log(`TELEGRAM_SESSION="${client.session.save()}"`);
  
  await client.disconnect();
  rl.close();
}

setup();
```

**Запуск на VPS:**
```bash
ssh root@31.172.75.175
docker exec -it [container] node scripts/telegram-setup.ts
# Ввести телефон и код
# Скопировать TELEGRAM_SESSION в Dokploy
```

---

## ТЕСТИРОВАНИЕ

### 1. Setup (один раз)
```bash
# На VPS
npm run telegram:setup
# Добавить TELEGRAM_SESSION в Dokploy
```

### 2. Добавить тестовый канал
- Открой админку
- Добавь источник: type=TELEGRAM, url=@uniannet
- Test - должен вернуть success

### 3. Импортировать
- Нажми Import
- Проверь что статьи появились в БД

### 4. Автоматический импорт
- Подожди 30 минут
- Проверь что cron импортировал новые посты

---

## КРИТЕРИИ ГОТОВНОСТИ

- [ ] Telethon установлен на VPS
- [ ] API credentials получены
- [ ] Setup script выполнен (TELEGRAM_SESSION сохранён)
- [ ] Telegram service создан (client.ts, parser.ts)
- [ ] Форма админки поддерживает TELEGRAM
- [ ] Test API работает для Telegram
- [ ] Импорт постов работает
- [ ] AI фильтр применяется к постам
- [ ] Cron импортирует Telegram каналы
- [ ] Протестировано с реальным каналом (@uniannet)

---

## ВАЖНО!

1. **НЕ запускай Telethon локально** - только на VPS!
2. **Session string** нужен для повторных подключений без кода
3. **Rate limits** - Telegram ограничивает частоту запросов
4. **Медиа** - пока можно пропустить, добавим позже
5. **Приватные каналы** - требуют join сначала

---

## НАЧИНАЙ!

Работай автономно. Отчёт когда тестовый Telegram канал успешно импортируется.
