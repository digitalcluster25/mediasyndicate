# Автоматическое обновление метрик из Telegram

## Описание

Сервис автоматически обновляет метрики статей (views, forwards, reactions, replies) из Telegram каналов каждые 30 секунд и пересчитывает рейтинг.

## Архитектура

1. **TelegramMetricsUpdateService** - сервис для обновления метрик
   - Парсит все активные Telegram каналы
   - Обновляет метрики существующих статей
   - Пересчитывает рейтинг после обновления

2. **API Endpoint** - `/api/cron/metrics-update`
   - Вызывается каждые 30 секунд через cron
   - Обновляет метрики для всех Telegram источников

## Настройка Cron

### Вариант 1: Внешний cron (рекомендуется)

Настройте cron на сервере для вызова каждые 30 секунд:

```bash
# Добавить в crontab (crontab -e)
* * * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://mediasyndicate.online/api/cron/metrics-update
* * * * * sleep 30 && curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://mediasyndicate.online/api/cron/metrics-update
```

### Вариант 2: Через внешний сервис (cron-job.org, EasyCron и т.д.)

1. Зарегистрируйтесь на cron-job.org
2. Создайте задачу:
   - URL: `https://mediasyndicate.online/api/cron/metrics-update`
   - Method: GET
   - Headers: `Authorization: Bearer YOUR_CRON_SECRET`
   - Schedule: каждые 30 секунд

### Вариант 3: Внутренний интервал (для разработки)

Можно добавить внутренний интервал в приложении, но это не рекомендуется для продакшена.

## Переменные окружения

Добавьте в `.env`:

```env
CRON_SECRET=your-secret-key-here
```

## Ручной вызов

Для тестирования можно вызвать вручную:

```bash
curl https://mediasyndicate.online/api/cron/metrics-update
```

Или с авторизацией:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://mediasyndicate.online/api/cron/metrics-update
```

## Логи

Сервис логирует:
- Количество обработанных источников
- Количество обновленных статей
- Ошибки при обновлении

Проверяйте логи сервера для мониторинга работы.

## Производительность

- Обновление одного источника занимает ~2-5 секунд
- При большом количестве источников может потребоваться оптимизация
- Рекомендуется обновлять не чаще чем раз в 30 секунд

