# CURSOR: НАСТРОИТЬ ЛОКАЛЬНУЮ БД ДЛЯ РАЗРАБОТКИ

## ПРОБЛЕМА
API возвращает 500: "Can't reach database server at 31.172.75.175:5432"
Локально нет доступа к production БД.

## РЕШЕНИЕ
Использовать локальный PostgreSQL или SQLite для разработки.

---

## ВАРИАНТ 1: SQLite (БЫСТРО, БЕЗ УСТАНОВКИ)

### Шаг 1: Создать .env.local для dev

```bash
# .env.local (только для локальной разработки)
DATABASE_URL="file:./dev.db"
```

### Шаг 2: Обновить schema.prisma

Добавь в начало:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"  // Изменить с postgresql на sqlite для локальной разработки
  url      = env("DATABASE_URL")
}
```

### Шаг 3: Применить миграции

```bash
npx prisma migrate dev --name init
npx prisma db push
```

### Шаг 4: Заполнить тестовыми данными

```bash
npx prisma studio
```

Или создать seed:
```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.source.create({
    data: {
      name: 'Test Source',
      type: 'RSS',
      url: 'https://example.com/rss',
      isActive: true
    }
  });
}

main();
```

---

## ВАРИАНТ 2: Docker PostgreSQL (ЛУЧШЕ ДЛЯ PRODUCTION-LIKE)

### Создать docker-compose.yml в корне:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: mediasyndicate
      POSTGRES_PASSWORD: dev_password
      POSTGRES_DB: mediasyndicate_dev
    ports:
      - "5433:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### .env.local:

```bash
DATABASE_URL="postgresql://mediasyndicate:dev_password@localhost:5433/mediasyndicate_dev"
```

### Запустить:

```bash
docker-compose up -d
npx prisma migrate dev
```

---

## РЕКОМЕНДАЦИЯ ДЛЯ ANDY

**Используй SQLite (Вариант 1)** - быстрее для локальной разработки:

1. Создай `.env.local` с SQLite URL
2. Измени provider в schema.prisma
3. Запусти `npx prisma migrate dev`
4. Добавь тестовый источник через Prisma Studio
5. Протестируй админку

**ПОСЛЕ ЭТОГО:**
- Локально будет работать вся функциональность
- Можно тестировать добавление источников
- Можно тестировать импорт статей
- Всё без доступа к production БД

---

## ВАЖНО!

`.env.local` не коммитится в Git (уже в .gitignore).
Production использует свой DATABASE_URL из Dokploy.

**Хочешь я создам это для тебя?**
