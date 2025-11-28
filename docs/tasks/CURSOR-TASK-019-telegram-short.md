# CURSOR: TELEGRAM ПАРСИНГ - АВТОНОМНАЯ ЗАДАЧА

## ЦЕЛЬ
Добавить поддержку Telegram каналов как источников новостей.

## ЧТО НУЖНО

1. **Установить Telethon** (только на VPS, не локально!)
2. **Получить API credentials** с https://my.telegram.org/apps
3. **Создать Telegram service** для парсинга каналов
4. **Добавить в админку** выбор типа TELEGRAM
5. **Импорт постов** аналогично RSS

## КРИТИЧНО

⚠️ **Telethon ТОЛЬКО на VPS (31.172.75.175)!**
Локально нельзя - Telegram банит аккаунты за смену IP.

## АРХИТЕКТУРА

```
Source.type = 'TELEGRAM'
Source.url = '@channel_username'

Telegram → Telethon → Posts → AI фильтр → Articles
```

## ФАЙЛЫ

- `lib/telegram/client.ts` - TelegramClient с авторизацией
- `lib/telegram/parser.ts` - fetchChannelPosts()
- `lib/telegram/importer.ts` - importFromTelegram()
- `scripts/telegram-setup.ts` - первичная авторизация (на VPS)

## ENV VARS (Dokploy)

```bash
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash
TELEGRAM_SESSION=session_string  # После setup
```

## ПОТОК РАБОТЫ

### ФАЗА 1: Setup на VPS
```bash
ssh root@31.172.75.175
# Установить telethon
# Запустить setup script
# Ввести телефон + код
# Получить TELEGRAM_SESSION
# Добавить в Dokploy
```

### ФАЗА 2: Код
- Telegram client
- Parser для каналов
- Importer (как RSS)
- Обновить админку (добавить тип TELEGRAM)
- API test для Telegram
- Обновить cron

### ФАЗА 3: Тест
- Добавить тестовый канал (@uniannet)
- Импортировать посты
- Проверить в БД

## ТЕСТ КАНАЛ
`@uniannet` - украинские новости, публичный

## ГОТОВНОСТЬ

- [ ] Setup выполнен на VPS
- [ ] Можно добавить Telegram канал в админке
- [ ] Test возвращает success
- [ ] Import создаёт статьи в БД
- [ ] Cron импортирует автоматически

---

## РАБОТАЙ АВТОНОМНО

1. Изучи Telethon docs
2. Создай код
3. Протестируй на VPS (не локально!)
4. Исправь ошибки
5. Отчёт когда работает

**Я ВЕРНУСЬ когда ты скажешь ГОТОВО.**
