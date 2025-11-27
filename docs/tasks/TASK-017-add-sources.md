# TASK-017: Добавление новостных источников (Kyiv Post, Interfax, Kyiv Independent)

**Версия:** 1.0  
**Дата:** 2024-11-26  
**Автор:** Claude  
**Статус:** 📋 Требует согласования

---

## 📋 ОГЛАВЛЕНИЕ

1. [Executive Summary](#1-executive-summary)
2. [Обзор задачи](#2-обзор-задачи)
3. [Технические требования](#3-технические-требования)
4. [Архитектура изменений](#4-архитектура-изменений)
5. [Детальная спецификация](#5-детальная-спецификация)
6. [План тестирования](#6-план-тестирования)
7. [Риски и ограничения](#7-риски-и-ограничения)
8. [Критерии приемки](#8-критерии-приемки)

---

## 1. EXECUTIVE SUMMARY

### 1.1 Цель
Расширить источники контента MediaSyndicate с 1 до 4 источников:
- **Текущее состояние**: BBC Ukraine (1 источник)
- **Целевое состояние**: BBC Ukraine + Kyiv Post + Interfax-Ukraine + Kyiv Independent (4 источника)

### 1.2 Обоснование
- **Увеличение покрытия**: больше новостей из разных источников
- **Диверсификация**: разные редакционные политики
- **Тестирование дедупликации**: проверка AI-кластеризации на реальных данных
- **MVP requirement**: минимум 3+ источника для демонстрации агрегации

### 1.3 Ожидаемый результат
- 4 активных RSS источника в базе
- ~200-300 статей после первого импорта
- Автоматический импорт каждые 30 минут
- Готовность к Phase 1 завершению

### 1.4 Время выполнения
- Разработка: 15 минут
- Тестирование: 30 минут  
- Deploy + верификация: 15 минут
- **Итого**: ~1 час

---

## 2. ОБЗОР ЗАДАЧИ

### 2.1 Контекст
MediaSyndicate находится в Phase 1 (MVP). Основная функциональность импорта уже работает:
- ✅ RSS парсер готов (lib/services/RSSParser.ts)
- ✅ Import сервис готов (lib/services/ImportService.ts)
- ✅ Database schema готова (Source, Article)
- ✅ Один источник (BBC Ukraine) импортируется успешно

Что нужно: добавить 3 новых источника в seed.ts

### 2.2 Выбор источников

#### Критерии отбора:
1. **Английский язык** - для единообразия контента
2. **RSS feed доступен** - технически реализуемо
3. **Украинский фокус** - соответствие концепции проекта
4. **Репутация** - надежные источники
5. **Активность** - регулярные обновления

#### Выбранные источники:

| Источник | RSS URL | Обоснование | Ожидаемая частота |
|----------|---------|-------------|-------------------|
| **Kyiv Post** | https://www.kyivpost.com/feed | Основное англоязычное медиа Украины. 258K Facebook, 395K Twitter | ~10-15 статей/день |
| **Interfax-Ukraine** | https://en.interfax.com.ua/news/last.rss | Профессиональное агентство, работает с 1992. Используется Reuters, Bloomberg | ~20-30 статей/день |
| **Kyiv Independent** | https://kyivindependent.com/feed/ | Современное медиа, очень активное. 1.9M Twitter, высокое качество | ~15-20 статей/день |

#### Альтернативы (НЕ выбраны):
- **Ukrainska Pravda** - нет английского RSS фида (только украинский)
- **UNIAN** - слишком высокая частота (~100+ статей/день)

### 2.3 Объем изменений
- **Файлов изменено**: 1 (prisma/seed.ts)
- **Строк кода**: +45 строк
- **Новых зависимостей**: 0
- **Database migrations**: 0

---

## 3. ТЕХНИЧЕСКИЕ ТРЕБОВАНИЯ

### 3.1 Существующая инфраструктура

**Database** (PostgreSQL на VPS):
```sql
-- Текущая схема (НЕ меняется)
CREATE TABLE sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT UNIQUE,
  type TEXT NOT NULL,  -- 'RSS' или 'TELEGRAM'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE articles (
  id TEXT PRIMARY KEY,
  source_id TEXT REFERENCES sources(id),
  title TEXT NOT NULL,
  url TEXT UNIQUE NOT NULL,
  content TEXT,
  published_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**RSS Parser** (lib/services/RSSParser.ts):
```typescript
// Уже готов, НЕ меняется
export class RSSParser {
  public static async parse(url: string): Promise<RSSFeed> {
    const feed = await parser.parseURL(url);
    const items: RSSItem[] = feed.items.map(item => ({
      title: item.title || '',
      description: item.contentSnippet || item.content || undefined,
      link: item.link || '',
      pubDate: item.pubDate ? new Date(item.pubDate) : undefined,
      guid: item.guid || item.id || undefined,
    }));
    return { title: feed.title, items };
  }
}
```

**Import Service** (lib/services/ImportService.ts):
```typescript
// Уже готов, НЕ меняется
export class ImportService {
  public static async importFromSource(sourceId: string) {
    const source = await prisma.source.findUnique({ where: { id: sourceId } });
    if (!source || !source.isActive || source.type !== 'RSS') return;
    
    const feed = await RSSParser.parse(source.url);
    for (const item of feed.items) {
      await prisma.article.upsert({
        where: { url: item.link },
        update: { /* ... */ },
        create: { /* ... */ }
      });
    }
  }

  public static async importAll() {
    const sources = await prisma.source.findMany({ where: { isActive: true } });
    for (const source of sources) {
      if (source.type === 'RSS') {
        await this.importFromSource(source.id);
      }
    }
  }
}
```

### 3.2 Что нужно изменить
**ТОЛЬКО файл**: `prisma/seed.ts`

**Текущее содержимое**:
```typescript
const bbcUkraine = await prisma.source.upsert({
  where: { url: 'https://feeds.bbci.co.uk/news/world/europe/rss.xml' },
  update: {},
  create: {
    name: 'BBC Ukraine',
    url: 'https://feeds.bbci.co.uk/news/world/europe/rss.xml',
    type: 'RSS',
    isActive: true,
  },
});
```

**Нужно добавить**: 3 новых upsert блока для новых источников

### 3.3 Валидация RSS фидов
Перед добавлением в код, все RSS URLs **ОБЯЗАТЕЛЬНО** проверить вручную:

```bash
# Test 1: Kyiv Post
curl -I https://www.kyivpost.com/feed
# Expected: HTTP 200, Content-Type: application/rss+xml или text/xml

# Test 2: Interfax-Ukraine  
curl -I https://en.interfax.com.ua/news/last.rss
# Expected: HTTP 200, Content-Type: application/rss+xml

# Test 3: Kyiv Independent
curl -I https://kyivindependent.com/feed/
# Expected: HTTP 200, Content-Type: application/rss+xml
```

---

## 4. АРХИТЕКТУРА ИЗМЕНЕНИЙ

### 4.1 Диаграмма компонентов
```
┌──────────────────────────────────────────────────────┐
│                  BEFORE (1 источник)                  │
├──────────────────────────────────────────────────────┤
│                                                       │
│  seed.ts                                             │
│  ├─ BBC Ukraine (RSS)                                │
│  │   └─ https://feeds.bbci.co.uk/...                │
│  │                                                    │
│  └─ [seed запускается]                               │
│      └─ 1 source в базе                              │
│                                                       │
└──────────────────────────────────────────────────────┘
                        ⬇️
┌──────────────────────────────────────────────────────┐
│                  AFTER (4 источника)                  │
├──────────────────────────────────────────────────────┤
│                                                       │
│  seed.ts                                             │
│  ├─ BBC Ukraine (RSS)                                │
│  ├─ Kyiv Post (RSS)        ← НОВЫЙ                   │
│  ├─ Interfax-Ukraine (RSS) ← НОВЫЙ                   │
│  └─ Kyiv Independent (RSS) ← НОВЫЙ                   │
│                                                       │
│  [seed запускается]                                  │
│  └─ 4 sources в базе                                 │
│      │                                                │
│      ├─ importAll() импортирует со всех 4            │
│      └─ ~200-300 articles после первого импорта      │
│                                                       │
└──────────────────────────────────────────────────────┘
```

### 4.2 Data Flow (импорт новостей)
```
1. SCHEDULED JOB (каждые 30 мин)
   └─> ImportService.importAll()

2. GET ACTIVE SOURCES
   └─> prisma.source.findMany({ where: { isActive: true } })
       └─> Результат: [BBC, Kyiv Post, Interfax, Kyiv Independent]

3. FOR EACH SOURCE (параллельно или последовательно)
   ├─> IF source.type === 'RSS':
   │   └─> RSSParser.parse(source.url)
   │       └─> Получить feed.items[]
   │
   └─> FOR EACH item IN feed.items:
       └─> prisma.article.upsert({
             where: { url: item.link },
             create: { /* новая статья */ },
             update: { /* обновить если уже есть */ }
           })

4. РЕЗУЛЬТАТ
   ├─> Новые статьи добавлены в БД
   ├─> Существующие статьи обновлены
   └─> Логирование: "Imported X articles from Y sources"
```

### 4.3 Зависимости
```mermaid
graph TB
    A[seed.ts] -->|создает| B[4 Sources в DB]
    B -->|используется| C[ImportService.importAll]
    C -->|для каждого источника| D[RSSParser.parse]
    D -->|возвращает| E[RSSFeed]
    E -->|обрабатывается| F[prisma.article.upsert]
    F -->|сохраняет| G[Articles в DB]
```

---

## 5. ДЕТАЛЬНАЯ СПЕЦИФИКАЦИЯ

### 5.1 Изменения в seed.ts

**Текущий файл** (`prisma/seed.ts`):
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const bbcUkraine = await prisma.source.upsert({
    where: { url: 'https://feeds.bbci.co.uk/news/world/europe/rss.xml' },
    update: {},
    create: {
      name: 'BBC Ukraine',
      url: 'https://feeds.bbci.co.uk/news/world/europe/rss.xml',
      type: 'RSS',
      isActive: true,
    },
  });

  console.log(`Created source: ${bbcUkraine.name}`);
  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Новый файл** (с добавленными источниками):
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with news sources...');

  // 1. BBC Ukraine
  const bbcUkraine = await prisma.source.upsert({
    where: { url: 'https://feeds.bbci.co.uk/news/world/europe/rss.xml' },
    update: {},
    create: {
      name: 'BBC Ukraine',
      url: 'https://feeds.bbci.co.uk/news/world/europe/rss.xml',
      type: 'RSS',
      isActive: true,
    },
  });
  console.log(`✅ Created source: ${bbcUkraine.name}`);

  // 2. Kyiv Post (NEW)
  const kyivPost = await prisma.source.upsert({
    where: { url: 'https://www.kyivpost.com/feed' },
    update: {},
    create: {
      name: 'Kyiv Post',
      url: 'https://www.kyivpost.com/feed',
      type: 'RSS',
      isActive: true,
    },
  });
  console.log(`✅ Created source: ${kyivPost.name}`);

  // 3. Interfax-Ukraine (NEW)
  const interfax = await prisma.source.upsert({
    where: { url: 'https://en.interfax.com.ua/news/last.rss' },
    update: {},
    create: {
      name: 'Interfax-Ukraine',
      url: 'https://en.interfax.com.ua/news/last.rss',
      type: 'RSS',
      isActive: true,
    },
  });
  console.log(`✅ Created source: ${interfax.name}`);

  // 4. Kyiv Independent (NEW)
  const kyivIndependent = await prisma.source.upsert({
    where: { url: 'https://kyivindependent.com/feed/' },
    update: {},
    create: {
      name: 'Kyiv Independent',
      url: 'https://kyivindependent.com/feed/',
      type: 'RSS',
      isActive: true,
    },
  });
  console.log(`✅ Created source: ${kyivIndependent.name}`);

  console.log('\n📊 Summary:');
  console.log('Total sources: 4');
  console.log('  - BBC Ukraine');
  console.log('  - Kyiv Post');
  console.log('  - Interfax-Ukraine');
  console.log('  - Kyiv Independent');
  console.log('\n✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 5.2 Метаданные источников

| Поле | Значение | Обоснование |
|------|----------|-------------|
| **name** | Human-readable название | Отображается в UI |
| **url** | RSS feed URL | Используется для импорта |
| **type** | 'RSS' | Пока только RSS (Telegram в Phase 3) |
| **isActive** | true | Источник активен для импорта |

### 5.3 Конфигурация импорта
**Никаких изменений НЕ требуется** - ImportService уже настроен на работу с любым количеством источников:

```typescript
// lib/services/ImportService.ts (текущий код, НЕ меняется)
public static async importAll() {
  const sources = await prisma.source.findMany({
    where: { isActive: true }  // Автоматически найдет все 4 источника
  });

  for (const source of sources) {
    if (source.type === 'RSS') {
      await this.importFromSource(source.id);
    }
  }
}
```

---

## 6. ПЛАН ТЕСТИРОВАНИЯ

### 6.1 Unit тесты (опционально)
**Не требуется** - изменяется только data seed, без изменения логики

### 6.2 Интеграционные тесты

#### Test 1: Seed выполняется успешно
```bash
cd /Users/macbookpro/Desktop/mediasyndicate
npx prisma db seed
```

**Ожидаемый результат**:
```
✅ Created source: BBC Ukraine
✅ Created source: Kyiv Post
✅ Created source: Interfax-Ukraine
✅ Created source: Kyiv Independent

📊 Summary:
Total sources: 4
...
✅ Seeding completed successfully!
```

**Критерий прохождения**: exit code 0, все 4 источника созданы

#### Test 2: Проверка в базе
```bash
# Подключение к PostgreSQL на VPS
psql postgresql://postgres:testpassword123@31.172.75.175:5432/mediasyndicate

# Проверка
SELECT id, name, url, type, is_active FROM sources ORDER BY created_at;
```

**Ожидаемый результат**:
```
 id   | name              | url                                    | type | is_active
------+-------------------+----------------------------------------+------+-----------
 xxx1 | BBC Ukraine       | https://feeds.bbci.co.uk/...           | RSS  | t
 xxx2 | Kyiv Post         | https://www.kyivpost.com/feed          | RSS  | t
 xxx3 | Interfax-Ukraine  | https://en.interfax.com.ua/news/...    | RSS  | t
 xxx4 | Kyiv Independent  | https://kyivindependent.com/feed/      | RSS  | t
(4 rows)
```

**Критерий прохождения**: 4 строки, все isActive = true

#### Test 3: Импорт работает
```bash
# Запуск импорта
curl -X POST http://localhost:3000/api/import
```

**Ожидаемый результат**:
```json
{
  "success": true,
  "imported": 87,
  "errors": 0
}
```

**Критерий прохождения**: imported > 50, errors = 0

#### Test 4: Статьи появились в UI
```
1. Открыть http://localhost:3000
2. Проверить что есть статьи от всех 4 источников
```

**Ожидаемый результат**: видны статьи с разных источников

### 6.3 Production тесты

#### Test 5: Deploy на VPS
```bash
# После push на GitHub, Dokploy автоматически deploy
# Проверка:
curl https://mediasyndicate.online/api/health
```

**Ожидаемый результат**:
```json
{
  "status": "healthy",
  "stats": {
    "sources": 4,
    "articles": 150
  }
}
```

#### Test 6: Cron импорт работает
```
Подождать 30 минут после deploy
Проверить что статьи обновляются автоматически
```

**Как проверить**:
1. Записать количество статей: N1
2. Подождать 30 минут
3. Проверить количество статей: N2
4. N2 должно быть >= N1

---

## 7. РИСКИ И ОГРАНИЧЕНИЯ

### 7.1 Технические риски

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| RSS feed недоступен | Средняя | Высокое | Добавить try-catch в ImportService, логировать ошибки |
| Rate limiting от источника | Низкая | Среднее | Импорт каждые 30 мин (не агрессивно) |
| Изменение формата RSS | Низкая | Среднее | Мониторинг логов, быстрое реагирование |
| Дубликаты статей | Высокая | Низкое | upsert по URL - автоматически обрабатывается |

### 7.2 Бизнес риски

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Источник прекращает работу | Низкая | Среднее | 4 источника - диверсификация |
| Изменение URL RSS | Низкая | Низкое | Быстрое обновление seed.ts |
| Контент не на английском | Низкая | Среднее | Проверка перед добавлением |

### 7.3 Ограничения

1. **Только RSS** - Telegram источники в Phase 3
2. **Только английский** - нет поддержки украинского/русского пока
3. **Нет AI фильтрации** - будет добавлено в следующих задачах
4. **Нет дедупликации** - будет добавлено в следующих задачах
5. **Простой импорт** - без приоритетов источников

---

## 8. КРИТЕРИИ ПРИЕМКИ

### 8.1 Функциональные требования

- [ ] seed.ts содержит 4 источника (BBC, Kyiv Post, Interfax, Kyiv Independent)
- [ ] `npx prisma db seed` выполняется без ошибок
- [ ] В базе 4 активных источника
- [ ] ImportService импортирует со всех 4 источников
- [ ] Статьи появляются в UI
- [ ] Deploy на production успешен
- [ ] Cron импорт работает автоматически

### 8.2 Нефункциональные требования

- [ ] Время seed < 5 секунд
- [ ] Время импорта < 60 секунд для всех источников
- [ ] Нет memory leaks
- [ ] Логирование работает корректно
- [ ] Код соответствует существующему стилю

### 8.3 Документация

- [ ] ROADMAP.md обновлен (источники добавлены)
- [ ] Commit message описательный
- [ ] TASK-017 отмечен как выполненный

---

## 9. ИНСТРУКЦИЯ ДЛЯ CURSOR

### Шаг 1: Обновить seed.ts
Открой файл `prisma/seed.ts` и замени содержимое на код из секции 5.1 (Новый файл)

### Шаг 2: Тестирование
```bash
# Test seed
npx prisma db seed

# Test import
npm run dev
# В другом терминале:
curl -X POST http://localhost:3000/api/import

# Проверить UI
open http://localhost:3000
```

### Шаг 3: Commit
```bash
git add prisma/seed.ts
git commit -m "feat: add 3 new RSS sources (Kyiv Post, Interfax, Kyiv Independent)"
git push origin main
```

### Шаг 4: Верификация на production
Подождать 2-3 минуты после push (Dokploy автоматически deploy)
```bash
curl https://mediasyndicate.online/api/health
# Должно показать sources: 4
```

---

## 10. ROLLBACK ПЛАН

Если что-то пошло не так:

### Вариант 1: Откат seed.ts
```bash
git revert HEAD
git push origin main
```

### Вариант 2: Удалить источники вручную
```sql
-- Подключение к БД
psql postgresql://postgres:testpassword123@31.172.75.175:5432/mediasyndicate

-- Удалить новые источники
DELETE FROM sources WHERE name IN ('Kyiv Post', 'Interfax-Ukraine', 'Kyiv Independent');
```

### Вариант 3: Деактивировать источники
```sql
UPDATE sources 
SET is_active = false 
WHERE name IN ('Kyiv Post', 'Interfax-Ukraine', 'Kyiv Independent');
```

---

## 11. СЛЕДУЮЩИЕ ШАГИ (AFTER THIS TASK)

После успешного выполнения этой задачи:

1. **TASK-018**: Настроить автоматический импорт (cron каждые 30 мин)
2. **TASK-019**: Добавить AI фильтрацию (UkraineFilter)
3. **TASK-020**: Добавить базовую дедупликацию
4. **TASK-021**: Категоризация статей (8 категорий)

---

## 12. ВОПРОСЫ ДЛЯ СОГЛАСОВАНИЯ

**Для Andy:**

1. ✅ Согласен с выбором источников (Kyiv Post, Interfax, Kyiv Independent)?
2. ❓ Нужно ли добавить украинские источники (Ukrainska Pravda на украинском)?
3. ❓ Приоритет импорта - все источники равны или нужна приоритизация?
4. ❓ Как часто импортировать - каждые 30 минут достаточно?
5. ❓ Лимит статей на источник - нужен или нет?

**После согласования**: Cursor начнет реализацию по инструкции из секции 9

---

**Конец документа**