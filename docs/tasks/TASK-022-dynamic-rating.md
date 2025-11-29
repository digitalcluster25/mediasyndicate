# TASK-022: Динамический рейтинг (MediaMetrics style)

**Дата:** 2024-11-29  
**Приоритет:** HIGH  
**Статус:** TODO  
**Оценка:** 4-6 часов

---

## 📋 Описание

Реализовать динамический рейтинг новостей по образцу MediaMetrics.ru:
- Real-time обновление списка на фронтенде (polling)
- Отслеживание изменения позиций (shift up/down)
- Отслеживание изменения рейтинга (delta)
- Визуальные индикаторы для "горячих" и "новых" статей
- Анимации перемещения

---

## 🎯 Референс: MediaMetrics.ru

**Как работает MediaMetrics:**
1. Рейтинг строится по количеству переходов из соцсетей
2. Обновление данных:
   - `online` (10 мин) - каждые 10 секунд
   - `hour` (1 час) - каждую минуту  
   - `day` (24 часа) - каждые 5 минут

**Структура данных MediaMetrics:**
| Поле | Описание |
|------|----------|
| Visitors | Количество посетителей за период |
| Delta | Разница с прошлого обновления |
| Shift | Движение по позициям (< 0 = вверх, > 0 = вниз) |

**Визуальные индикаторы:**
- 🟡 Жёлтый фон - новая статья в периоде
- 🔴 Красная рамка - "горячая" (shift > 14)

---

## 📐 Архитектура

### 1. Изменения в БД (Prisma)

```prisma
model Article {
  // ... существующие поля ...
  
  // НОВЫЕ поля для динамики
  previousRating    Float     @default(0)    // Рейтинг на прошлом обновлении
  previousPosition  Int       @default(0)    // Позиция на прошлом обновлении
  currentPosition   Int       @default(0)    // Текущая позиция
  positionChange    Int       @default(0)    // Изменение позиции (shift)
  ratingDelta       Float     @default(0)    // Изменение рейтинга
  firstSeenAt       DateTime  @default(now()) // Когда впервые попала в рейтинг
}
```

### 2. Обновлённый RatingService

**Файл:** `lib/services/RatingService.ts`

```typescript
// Добавить метод для обновления с отслеживанием динамики
public static async recalculateWithDynamics(): Promise<{
  updated: number;
  errors: number;
  newInTop: number;
  movedUp: number;
  movedDown: number;
}> {
  // 1. Получить все статьи с текущими позициями
  // 2. Пересчитать рейтинги
  // 3. Отсортировать по новому рейтингу
  // 4. Для каждой статьи:
  //    - previousRating = rating (старый)
  //    - previousPosition = currentPosition (старая)
  //    - rating = новый рейтинг
  //    - currentPosition = новая позиция в списке
  //    - positionChange = previousPosition - currentPosition
  //    - ratingDelta = rating - previousRating
  // 5. Сохранить в БД одним batch update
}

// Добавить метод для получения рейтинга с динамикой
public static async getTrendingWithDynamics(limit: number = 50): Promise<TrendingArticle[]>
```

### 3. Новый API Endpoint

**Файл:** `app/api/rating/live/route.ts`

```typescript
/**
 * GET /api/rating/live?period=online|hour|day
 * 
 * Возвращает рейтинг с динамическими данными для фронтенда
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'hour';
  const limit = parseInt(searchParams.get('limit') || '50');
  
  // Получить статьи с динамикой
  const articles = await RatingService.getTrendingWithDynamics(limit);
  
  return NextResponse.json({
    period,
    timestamp: Date.now(),
    articles: articles.map(a => ({
      id: a.id,
      title: a.title,
      url: a.url,
      sourceName: a.source.name,
      rating: a.rating,
      ratingDelta: a.ratingDelta,
      position: a.currentPosition,
      positionChange: a.positionChange, // + = вверх, - = вниз
      views: a.views,
      reactions: a.reactions,
      forwards: a.forwards,
      replies: a.replies,
      isNew: isNew(a.firstSeenAt, period),
      isHot: Math.abs(a.positionChange) > HOT_THRESHOLD
    }))
  });
}
```

### 4. React Hook для Real-time

**Файл:** `hooks/useLiveRating.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';

interface RatingArticle {
  id: string;
  title: string;
  url: string;
  sourceName: string;
  rating: number;
  ratingDelta: number;
  position: number;
  positionChange: number;
  views: number;
  reactions: number;
  forwards: number;
  replies: number;
  isNew: boolean;
  isHot: boolean;
}

interface UseLiveRatingOptions {
  period?: 'online' | 'hour' | 'day';
  limit?: number;
  enabled?: boolean;
}

// Интервалы обновления по периодам (в мс)
const POLL_INTERVALS = {
  online: 30_000,  // 30 сек
  hour: 120_000,   // 2 мин
  day: 300_000     // 5 мин
};

export function useLiveRating(options: UseLiveRatingOptions = {}) {
  const { period = 'hour', limit = 50, enabled = true } = options;
  
  const [articles, setArticles] = useState<RatingArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  const fetchRating = useCallback(async () => {
    try {
      const res = await fetch(`/api/rating/live?period=${period}&limit=${limit}`);
      if (!res.ok) throw new Error('Failed to fetch rating');
      
      const data = await res.json();
      setArticles(data.articles);
      setLastUpdate(data.timestamp);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [period, limit]);

  useEffect(() => {
    if (!enabled) return;
    
    fetchRating(); // Initial fetch
    
    const interval = setInterval(fetchRating, POLL_INTERVALS[period]);
    return () => clearInterval(interval);
  }, [fetchRating, period, enabled]);

  return { articles, loading, error, lastUpdate, refetch: fetchRating };
}
```

### 5. Компонент Live Rating

**Файл:** `components/LiveRating.tsx`

```tsx
'use client';

import { useLiveRating } from '@/hooks/useLiveRating';
import { Eye, Heart, Share2, MessageCircle, TrendingUp, TrendingDown, Flame, Sparkles } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

type Period = 'online' | 'hour' | 'day';

const PERIOD_LABELS: Record<Period, string> = {
  online: '10 минут',
  hour: '1 час',
  day: '24 часа'
};

export function LiveRating() {
  const [period, setPeriod] = useState<Period>('hour');
  const { articles, loading, error, lastUpdate } = useLiveRating({ period, limit: 50 });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header с выбором периода */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-8 h-8 text-orange-600" />
              <h1 className="text-4xl font-bold text-slate-900">Live Rating</h1>
            </div>
            <p className="text-slate-600">
              Обновлено: {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : '...'}
            </p>
          </div>
          
          {/* Period Tabs */}
          <div className="flex gap-2 bg-white rounded-lg p-1 shadow-sm">
            {(['online', 'hour', 'day'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  period === p
                    ? 'bg-orange-500 text-white shadow'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && articles.length === 0 && (
          <div className="text-center py-20">
            <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-slate-500 mt-4">Загрузка рейтинга...</p>
          </div>
        )}

        {/* Article List with Animations */}
        <div className="space-y-3">
          {articles.map((article, index) => (
            <Link
              key={article.id}
              href={`/article/${article.id}`}
              className="block"
            >
              <article
                className={`
                  bg-white rounded-xl shadow-sm hover:shadow-lg 
                  transition-all duration-300 p-4 border-2
                  ${article.isHot ? 'border-red-400 bg-red-50' : 'border-transparent'}
                  ${article.isNew ? 'bg-yellow-50' : ''}
                `}
                style={{
                  // CSS transition для плавного перемещения
                  transform: `translateY(0)`,
                  transition: 'transform 0.5s ease-out'
                }}
              >
                <div className="flex items-center gap-4">
                  {/* Position Badge */}
                  <div className={`
                    flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center 
                    font-bold text-white
                    ${index < 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600' : 'bg-slate-400'}
                  `}>
                    {index + 1}
                  </div>

                  {/* Position Change Indicator */}
                  <div className="w-12 flex-shrink-0">
                    {article.positionChange > 0 && (
                      <div className="flex items-center text-green-600 text-sm font-medium">
                        <TrendingUp className="w-4 h-4" />
                        <span>+{article.positionChange}</span>
                      </div>
                    )}
                    {article.positionChange < 0 && (
                      <div className="flex items-center text-red-600 text-sm font-medium">
                        <TrendingDown className="w-4 h-4" />
                        <span>{article.positionChange}</span>
                      </div>
                    )}
                    {article.positionChange === 0 && (
                      <div className="text-slate-400 text-sm">—</div>
                    )}
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {/* Hot Badge */}
                      {article.isHot && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-medium">
                          <Flame className="w-3 h-3" />
                          HOT
                        </span>
                      )}
                      {/* New Badge */}
                      {article.isNew && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                          <Sparkles className="w-3 h-3" />
                          NEW
                        </span>
                      )}
                      <span className="text-xs text-slate-500">{article.sourceName}</span>
                    </div>
                    
                    <h2 className="text-lg font-semibold text-slate-900 line-clamp-1 hover:text-orange-600 transition-colors">
                      {article.title}
                    </h2>
                  </div>

                  {/* Rating with Delta */}
                  <div className="flex-shrink-0 text-right">
                    <div className="text-lg font-bold text-orange-600">
                      {article.rating.toFixed(1)}
                    </div>
                    {article.ratingDelta !== 0 && (
                      <div className={`text-xs font-medium ${
                        article.ratingDelta > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {article.ratingDelta > 0 ? '+' : ''}{article.ratingDelta.toFixed(1)}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {!loading && articles.length === 0 && (
          <div className="text-center py-20">
            <TrendingUp className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">Нет статей в рейтинге</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

### 6. Обновлённая главная страница

**Файл:** `app/page.tsx`

```tsx
import { LiveRating } from '@/components/LiveRating';

export default function Home() {
  return <LiveRating />;
}
```

---

## 📁 Структура файлов

```
mediasyndicate/
├── prisma/
│   └── schema.prisma           # ✏️ Добавить новые поля
│
├── lib/services/
│   └── RatingService.ts        # ✏️ Добавить методы динамики
│
├── hooks/
│   └── useLiveRating.ts        # 🆕 Новый hook
│
├── components/
│   └── LiveRating.tsx          # 🆕 Новый компонент
│
├── app/
│   ├── page.tsx                # ✏️ Использовать LiveRating
│   └── api/
│       └── rating/
│           └── live/
│               └── route.ts    # 🆕 Новый endpoint
```

---

## ✅ Чеклист выполнения

### Этап 1: База данных
- [ ] Добавить поля в `prisma/schema.prisma`:
  - `previousRating Float @default(0)`
  - `previousPosition Int @default(0)`
  - `currentPosition Int @default(0)`
  - `positionChange Int @default(0)`
  - `ratingDelta Float @default(0)`
  - `firstSeenAt DateTime @default(now())`
- [ ] `npx prisma migrate dev --name add_rating_dynamics`
- [ ] `npx prisma generate`

### Этап 2: Backend
- [ ] Обновить `lib/services/RatingService.ts`:
  - Добавить `recalculateWithDynamics()`
  - Добавить `getTrendingWithDynamics()`
- [ ] Создать `app/api/rating/live/route.ts`
- [ ] Обновить `app/api/cron/rating/route.ts` использовать новый метод

### Этап 3: Frontend  
- [ ] Создать `hooks/useLiveRating.ts`
- [ ] Создать `components/LiveRating.tsx`
- [ ] Обновить `app/page.tsx`

### Этап 4: Тестирование
- [ ] Проверить API `/api/rating/live?period=hour`
- [ ] Проверить обновление позиций
- [ ] Проверить анимации на фронтенде
- [ ] Проверить индикаторы HOT и NEW

---

## 🧪 Тесты

### API Test
```bash
# Получить live рейтинг
curl https://mediasyndicate.online/api/rating/live?period=hour&limit=10

# Ожидаемый ответ:
{
  "period": "hour",
  "timestamp": 1732880000000,
  "articles": [
    {
      "id": "...",
      "title": "...",
      "rating": 150.5,
      "ratingDelta": 12.3,
      "position": 1,
      "positionChange": 2,
      "isNew": false,
      "isHot": true
    }
  ]
}
```

### UI Test (Chrome DevTools)
```javascript
// Проверить что компонент рендерится
document.querySelector('[class*="LiveRating"]') !== null

// Проверить наличие period tabs
document.querySelectorAll('button').length >= 3

// Проверить что статьи загрузились
document.querySelectorAll('article').length > 0
```

---

## 🔧 Константы и настройки

```typescript
// lib/constants/rating.ts

// Интервалы polling по периодам (в мс)
export const POLL_INTERVALS = {
  online: 30_000,   // 30 сек
  hour: 120_000,    // 2 мин
  day: 300_000      // 5 мин
} as const;

// Порог для "горячей" новости
export const HOT_THRESHOLD = 5; // позиций за обновление

// Время для определения "новой" статьи по периодам (в минутах)
export const NEW_THRESHOLDS = {
  online: 10,
  hour: 60,
  day: 1440
} as const;
```

---

## ⚠️ Важные замечания

1. **Server Components vs Client Components**
   - `page.tsx` может быть server component
   - `LiveRating.tsx` ДОЛЖЕН быть client component ('use client')
   - Hook работает только в client components

2. **Оптимизация**
   - Batch update в БД для производительности
   - Использовать `React.memo` для предотвращения лишних ререндеров
   - Добавить debounce для частых обновлений

3. **Edge cases**
   - Новая статья без предыдущей позиции: `positionChange = 0`
   - Статья выпала из топ-50: не показывать
   - Сервер недоступен: показать последние данные + ошибку

---

## 🚀 Команда для Cursor

```
Дай Cursor задачу TASK-022-dynamic-rating.md

После выполнения:
git add . && git commit -m "feat: dynamic live rating" && git push
```
