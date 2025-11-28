# CURSOR: TELEGRAM BOT TOKEN SETUP

## ЦЕЛЬ
Настроить TELEGRAM_BOT_TOKEN для парсинга Telegram каналов.

## STEP 1: СОЗДАНИЕ БОТА

1. Открой Telegram
2. Найди **@BotFather**
3. Отправь команду: `/newbot`
4. Введи имя бота (например: `MediaSyndicate Bot`)
5. Введи username (например: `MediaSyndicateNewsBot`)
6. **BotFather вернет токен** вида: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`

**ВАЖНО:** Сохрани токен! Он понадобится для следующих шагов.

## STEP 2: ЛОКАЛЬНЫЙ ТЕСТ

### 2.1 Добавить токен в .env.local

```bash
# В корне проекта
echo "TELEGRAM_BOT_TOKEN=YOUR_TOKEN_HERE" >> .env.local
```

Или отредактируй `.env.local` вручную:
```
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

### 2.2 Тест парсинга канала

```bash
# Запустить dev server
npm run dev

# В другом терминале - тест API
curl -X POST http://localhost:3000/api/admin/sources/test \
  -H "Content-Type: application/json" \
  -d '{"url": "@uniannet", "type": "TELEGRAM"}'
```

**Ожидаемый результат:**
```json
{
  "success": true,
  "itemsFound": 20,
  "sample": {
    "title": "...",
    "pubDate": "...",
    "link": "https://t.me/uniannet/12345"
  }
}
```

### 2.3 Тест через админку

1. Открой `http://localhost:3000/adminko/sources`
2. Нажми "+ Добавить источник"
3. Выбери тип: **TELEGRAM**
4. Введи канал: `@uniannet`
5. Нажми "Тест"
6. Должен вернуться успешный результат

## STEP 3: ПОДПИСКА БОТА НА КАНАЛ

**КРИТИЧНО:** Бот должен быть подписан на канал для получения сообщений!

1. Добавь бота в канал как администратора (или просто подпиши)
2. Или попроси администратора канала добавить бота

**Ограничение Telegram Bot API:**
- Бот может получать только **новые** сообщения через `getUpdates`
- Для истории нужен MTProto клиент (Telethon/Pyrogram)

## STEP 4: CHECKPOINT - ОСТАНОВИСЬ!

**НЕ ПРОДОЛЖАЙ ДАЛЬШЕ!**

После успешного локального теста:
1. Сообщи Andy токен
2. Попроси добавить `TELEGRAM_BOT_TOKEN` в Dokploy environment variables
3. **ЖДИ подтверждения** от Andy

## STEP 5: PRODUCTION ПРОВЕРКА

После того как Andy добавит токен в Dokploy:

### 5.1 Проверить что токен работает

```bash
curl -X POST https://mediasyndicate.online/api/admin/sources/test \
  -H "Content-Type: application/json" \
  -d '{"url": "@uniannet", "type": "TELEGRAM"}'
```

### 5.2 Добавить Telegram источник в админке

1. Открой `https://mediasyndicate.online/adminko/sources`
2. Добавь источник:
   - Тип: **TELEGRAM**
   - Название: `УНИАН`
   - URL: `@uniannet`
3. Нажми "Тест" - должен работать
4. Сохрани источник

## STEP 6: ТЕСТ ИМПОРТА

### 6.1 Ручной импорт

```bash
# Получить ID источника из админки
curl -X POST https://mediasyndicate.online/api/admin/sources/SOURCE_ID/import \
  -H "Cookie: admin-session=..."
```

### 6.2 Проверить статьи в БД

```bash
# Через Prisma Studio или API
curl https://mediasyndicate.online/api/articles
```

## STEP 7: АВТОМАТИЧЕСКИЙ ИМПОРТ

Проверить что cron job импортирует Telegram источники:

```bash
# Запустить импорт всех источников
curl -X POST https://mediasyndicate.online/api/import
```

## STEP 8: ФИНАЛЬНАЯ ВЕРИФИКАЦИЯ

✅ Токен работает локально
✅ Токен работает на production
✅ Можно добавить Telegram источник
✅ Импорт работает
✅ Статьи сохраняются в БД

## ТЕСТОВЫЕ КАНАЛЫ

- `@uniannet` - УНИАН, украинские новости
- `@bbcnukraine` - BBC News Україна
- `@kyivpost` - Kyiv Post

## ОГРАНИЧЕНИЯ TELEGRAM BOT API

⚠️ **Важно понимать:**

1. **Только новые сообщения:** Бот получает только сообщения, которые приходят ПОСЛЕ того как бот подписан
2. **Нет истории:** Нельзя получить старые посты через Bot API
3. **Подписка обязательна:** Бот должен быть подписан на канал
4. **Для истории нужен Telethon:** Если нужна полная история, используй Telethon (Python) на VPS

## TROUBLESHOOTING

### Ошибка: "TELEGRAM_BOT_TOKEN not configured"
- Проверь что токен добавлен в `.env.local` (локально) или Dokploy (production)
- Перезапусти dev server после добавления токена

### Ошибка: "Failed to get channel info"
- Проверь что канал существует и публичный
- Проверь формат: `@username` или `https://t.me/username`

### Ошибка: "No posts found"
- Бот должен быть подписан на канал
- Бот получает только новые сообщения (после подписки)
- Для истории используй Telethon

### Ошибка: "Unauthorized"
- Проверь что токен правильный
- Проверь что бот не заблокирован

