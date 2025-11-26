# TASK-001: MVP Setup - RSS Import

## ЦЕЛЬ
Создать работающий MVP: RSS импорт → PostgreSQL → показ статей

## ЗАДАЧА ДЛЯ CURSOR

Создай полный Next.js 15 проект со следующими компонентами:

### 1. package.json
Добавь ТОЧНО эти зависимости:
- @prisma/client: 5.22.0
- next: 15.0.0
- react: 19.0.0
- react-dom: 19.0.0
- rss-parser: 3.13.0 (ВАЖНО: НЕ fast-xml-parser!)

### 2. Конфиги
- next.config.mjs: output: 'standalone'
- tsconfig.json: стандартный Next.js
- tailwind.config.ts: paths для app/**
- postcss.config.mjs: tailwindcss + autoprefixer

### 3. Структура файлов
```
lib/
  config.ts - export config с features: {telegram, ai, vectorSearch}
  prisma.ts - PrismaClient singleton
  services/
    RSSParser.ts - используй rss-parser, не fast-xml-parser!
    ImportService.ts - импорт из Source

prisma/
  schema.prisma:
    - model Source: id, name, url, type (RSS/TELEGRAM), isActive
    - model Article: id, title, url, content, publishedAt, sourceId
  seed.ts - создай BBC Ukraine source

app/
  layout.tsx - базовый layout с metadata
  globals.css - @tailwind директивы
  page.tsx - список статей, dynamic='force-dynamic'
  api/
    health/route.ts - GET {status, stats}
    import/route.ts - POST вызов ImportService.importAll()
```

### 4. КРИТИЧНО: ТЕСТИРОВАНИЕ

После создания файлов:

1. Запусти: ./test.sh
2. Читай ошибки
3. Исправляй
4. Повторяй пока ./test.sh не пройдет БЕЗ ОШИБОК

ВАЖНО: НЕ останавливайся пока test.sh полностью не пройдет!

## ПРОВЕРКА

test.sh должен:
- ✅ Подключиться к базе
- ✅ Сгенерировать Prisma client
- ✅ Установить зависимости
- ✅ Собрать проект (npm run build)
- ✅ Пройти линтинг

Только когда ВСЁ зеленое - задача завершена.
