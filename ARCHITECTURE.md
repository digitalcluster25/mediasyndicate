# TG Rating Board — Архитектура

## Стек
- **Frontend:** React 18 + Vite + shadcn/ui + Tailwind CSS (grayscale palette)
- **Backend:** Node.js + Express + TypeScript
- **ORM:** Prisma + PostgreSQL
- **Сбор данных:** Telegram API через Telegraf/grammY
- **Деплой:** VPS (Docker Compose)

## Метрики рейтинга
### Engagement Score (дневной)
```
баллы = реакции × 0.1 + репосты × 1 + комментарии × 2
```
### Итоговый рейтинг — взвешенная сумма:
- Кол-во подписчиков (нормализовано)
- Engagement Score × коэффициент
- Темп роста (% за 7 дней)
- Экспертная оценка (1–5)
Веса настраиваются в админ-панели.

## API (REST)
| Метод | Путь | Описание |
|-------|------|----------|
| GET | /api/channels | Список каналов (пагинация, фильтры, поиск) |
| GET | /api/channels/:id | Карточка канала со статистикой |
| POST | /api/channels | Добавить канал → модерация |
| GET | /api/categories | Список категорий |
| GET | /api/ranking | Рейтинг с пагинацией и сортировкой |
| GET | /api/stats/:channelId | Детальная статистика |
| POST | /api/expert-rating | Экспертная оценка |
| **Admin** | | |
| PUT/DELETE | /api/admin/channels/:id | Управление каналами |
| POST | /api/admin/moderate/:id | Модерация |
| GET | /api/admin/queue | Очередь на модерацию |

## База данных
- `channels` — telegram_id, username, title, category_id, country, language
- `categories` — id, name, slug
- `channel_stats` — subscribers, reactions, reposts, comments, engagement_score (ежедневно)
- `channel_posts` — посты каналов для SEO-индексации
- `expert_ratings` — оценки 1–5
- `moderation_queue` — статусы pending/approved/rejected

## Cron-задачи
Ежедневно: сбор статистики из Telegram API → пересчёт рейтинга → запись в channel_stats.

## SEO
- Мета-теги Open Graph для каждой страницы канала
- JSON-LD структурированные данные
- Автоматический sitemap.xml
- SSR/pre-rendering ключевых страниц
