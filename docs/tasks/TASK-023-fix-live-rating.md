# TASK-023: Fix Live Rating - одна строка + позиции

**Дата:** 2024-11-29  
**Приоритет:** HIGH  
**Статус:** TODO  
**Оценка:** 30 мин

---

## 🐛 Проблемы

1. **Движение по позициям = 0** - все статьи показывают "—"
2. **Карточка в 2 строки** - должна быть в 1 строку

---

## 🔧 Фикс 1: Инициализация позиций

**Проблема:** Все `currentPosition = 0`, поэтому при первом расчёте `positionChange = 0`.

**Решение:** Изменить логику - если `previousPosition = 0`, это значит статья новая, показываем как NEW.

**Файл:** `lib/services/RatingService.ts`

Найти в методе `recalculateWithDynamics`:
```typescript
const positionChange = previousPosition > 0 
  ? previousPosition - newPosition // + = вверх, - = вниз
  : 0;
```

Заменить на:
```typescript
// Если статья впервые в рейтинге, не показываем изменение
const isFirstTime = article.currentPosition === 0 || article.currentPosition === null;
const positionChange = isFirstTime ? 0 : (article.currentPosition - newPosition);
```

---

## 🔧 Фикс 2: Карточка в одну строку

**Файл:** `components/LiveRating.tsx`

Заменить секцию `{/* Main Content */}` на:

```tsx
{/* Main Content - ONE LINE */}
<div className="flex-1 min-w-0 flex items-center gap-2">
  {/* Hot Badge */}
  {article.isHot && (
    <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-medium">
      <Flame className="w-3 h-3" />
      HOT
    </span>
  )}
  {/* New Badge */}
  {article.isNew && (
    <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
      <Sparkles className="w-3 h-3" />
      NEW
    </span>
  )}
  {/* Source */}
  <span className="flex-shrink-0 text-xs text-slate-500">{article.sourceName}</span>
  
  {/* Title - truncate */}
  <h2 className="text-base font-semibold text-slate-900 truncate hover:text-orange-600 transition-colors">
    {article.title}
  </h2>
</div>
```

**Ключевые изменения:**
- Убрать `flex-col` и `mb-1` 
- Добавить `flex items-center` для горизонтального расположения
- `flex-shrink-0` для бейджей чтобы не сжимались
- `truncate` вместо `line-clamp-1` для заголовка
- Уменьшить `text-lg` на `text-base`

---

## 🔧 Фикс 3: Запустить пересчёт дважды

После деплоя вызвать cron 2 раза:
```bash
curl https://mediasyndicate.online/api/cron/rating
# подождать 30 сек
curl https://mediasyndicate.online/api/cron/rating
```

Или можно добавить endpoint для инициализации:

**Файл:** `app/api/rating/init/route.ts`
```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RatingService } from '@/lib/services/RatingService';

/**
 * Инициализация позиций для всех статей
 * Запустить один раз
 */
export async function GET() {
  // Шаг 1: Первый пересчёт - устанавливает currentPosition
  await RatingService.recalculateWithDynamics();
  
  // Шаг 2: Второй пересчёт - теперь positionChange будет работать
  const result = await RatingService.recalculateWithDynamics();
  
  return NextResponse.json({
    success: true,
    message: 'Positions initialized',
    ...result
  });
}
```

---

## ✅ Чеклист

- [ ] Обновить `RatingService.ts` - фикс логики positionChange
- [ ] Обновить `LiveRating.tsx` - карточка в одну строку  
- [ ] Создать `/api/rating/init` endpoint
- [ ] Git push
- [ ] Вызвать `/api/rating/init` после деплоя

---

## 🚀 Команда для Cursor

```
Выполни задачу docs/tasks/TASK-023-fix-live-rating.md
```
