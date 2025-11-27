# TASK-018: Админ-панель управления источниками

**Версия:** 1.0  
**Дата:** 2024-11-27  
**Автор:** Claude  
**Статус:** ✅ УТВЕРЖДЕНО к разработке

---

## 📋 ОГЛАВЛЕНИЕ

1. [Executive Summary](#1-executive-summary)
2. [Архитектура системы](#2-архитектура-системы)
3. [Авторизация](#3-авторизация)
4. [UI/UX Спецификация](#4-uiux-спецификация)
5. [API Спецификация](#5-api-спецификация)
6. [Database Schema](#6-database-schema)
7. [Компоненты](#7-компоненты)
8. [Инструкция для Cursor](#8-инструкция-для-cursor)
9. [План тестирования](#9-план-тестирования)
10. [Критерии приемки](#10-критерии-приемки)

---

## 1. EXECUTIVE SUMMARY

### 1.1 Цель
Создать защищённую админ-панель для управления RSS/Telegram источниками новостей.

### 1.2 Ключевые фичи (в порядке приоритета)
1. ✅ **Авторизация** - защита админки (hardcoded credentials)
2. ✅ **Просмотр списка источников** - таблица со всеми источниками
3. ✅ **Добавление нового источника** - форма с валидацией
4. ✅ **Тест RSS подключения** - проверка перед добавлением
5. ✅ **Ручной импорт** - запуск импорта для источника
6. ✅ **Редактирование/удаление** - CRUD операции

### 1.3 Технологии
- Next.js 15 (App Router)
- shadcn/ui (компоненты)
- React Hook Form + Zod (формы)
- TanStack Query (state management)
- Prisma (БД)

### 1.4 Время выполнения
- Авторизация: 30 мин
- UI компоненты: 2 часа
- API endpoints: 1.5 часа
- Тестирование: 1 час
- **Итого**: ~5 часов

---

## 2. АРХИТЕКТУРА СИСТЕМЫ

### 2.1 Структура файлов
```
mediasyndicate/
├── app/
│   ├── admin/
│   │   ├── layout.tsx              # Admin layout с навигацией
│   │   ├── login/
│   │   │   └── page.tsx            # Страница логина
│   │   └── sources/
│   │       ├── page.tsx            # Список источников (main)
│   │       ├── components/
│   │       │   ├── SourceTable.tsx       # Таблица источников
│   │       │   ├── SourceForm.tsx        # Форма добавления/редактирования
│   │       │   ├── TestConnection.tsx    # Кнопка теста RSS
│   │       │   └── DeleteDialog.tsx      # Подтверждение удаления
│   │       └── [id]/
│   │           └── edit/
│   │               └── page.tsx    # Страница редактирования
│   │
│   ├── api/
│   │   ├── admin/
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   │   └── route.ts   # POST login
│   │   │   │   └── logout/
│   │   │   │       └── route.ts   # POST logout
│   │   │   └── sources/
│   │   │       ├── route.ts            # GET (list), POST (create)
│   │   │       ├── [id]/
│   │   │       │   └── route.ts        # GET, PATCH, DELETE
│   │   │       ├── [id]/test/
│   │   │       │   └── route.ts        # POST (test RSS)
│   │   │       └── [id]/import/
│   │   │           └── route.ts        # POST (manual import)
│   │
│   └── middleware.ts                    # Auth middleware (защита /admin)
│
├── lib/
│   ├── auth/
│   │   ├── session.ts              # Session management
│   │   └── credentials.ts          # Hardcoded credentials
│   └── services/
│       ├── RSSParser.ts            # Existing (НЕ меняется)
│       └── ImportService.ts        # Existing (НЕ меняется)
│
└── components/
    └── ui/                         # shadcn/ui компоненты
        ├── button.tsx
        ├── dialog.tsx
        ├── form.tsx
        ├── input.tsx
        ├── table.tsx
        └── ...
```

### 2.2 Flow диаграмма

```
┌─────────────────────────────────────────────────────────┐
│                    USER ACCESS FLOW                      │
└─────────────────────────────────────────────────────────┘

1. Пользователь → /admin/sources
   │
   ├─> middleware.ts проверяет сессию
   │   │
   │   ├─> Нет сессии → redirect /admin/login
   │   │   └─> Форма логина
   │   │       └─> POST /api/admin/auth/login
   │   │           ├─> Успех → Set cookie → redirect /admin/sources
   │   │           └─> Ошибка → Показать ошибку
   │   │
   │   └─> Есть сессия → пропустить на /admin/sources
   │
   └─> Показать админ-панель


┌─────────────────────────────────────────────────────────┐
│                   SOURCES CRUD FLOW                      │
└─────────────────────────────────────────────────────────┘

1. Просмотр списка:
   GET /api/admin/sources → SourceTable

2. Добавление:
   Click [+ Добавить]
   → Open SourceForm (dialog)
   → Fill form
   → Click [Тест подключения]
      → POST /api/admin/sources/test (без ID)
      → Show результат (✅/❌)
   → Click [Добавить]
      → POST /api/admin/sources
      → Refetch list

3. Редактирование:
   Click [✏️]
   → Navigate /admin/sources/[id]/edit
   → Load existing data
   → Edit form
   → Click [Сохранить]
      → PATCH /api/admin/sources/[id]
      → Redirect back to list

4. Удаление:
   Click [🗑️]
   → Open DeleteDialog
   → Click [Удалить]
      → DELETE /api/admin/sources/[id]
      → Refetch list

5. Ручной импорт:
   Click [🔄]
   → POST /api/admin/sources/[id]/import
   → Show progress
   → Show результат (imported count)
```

---

## 3. АВТОРИЗАЦИЯ

### 3.1 Требования безопасности
- ✅ Hardcoded credentials (НЕ в .env, в коде)
- ✅ Session cookie (HttpOnly, Secure)
- ✅ Middleware защита всех `/admin/*` роутов
- ✅ Logout функция
- ❌ Регистрация новых пользователей (не нужна)
- ❌ Восстановление пароля (не нужно)

### 3.2 Credentials (СУПЕР АДМИН)
```typescript
// lib/auth/credentials.ts
export const ADMIN_CREDENTIALS = {
  username: 'boss',
  password: '149521MkSF#u*V'
};
```

⚠️ **ВАЖНО**: Это временное решение для MVP. В Phase 4 заменим на полноценную систему с хешированием паролей.

### 3.3 Session Management

**lib/auth/session.ts:**
```typescript
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'mediasyndicate-secret-key-2024'
);

export interface SessionData {
  username: string;
  isAdmin: true;
  createdAt: number;
}

export async function createSession(username: string): Promise<string> {
  const token = await new SignJWT({ username, isAdmin: true } as SessionData)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET_KEY);

  return token;
}

export async function verifySession(token: string): Promise<SessionData | null> {
  try {
    const verified = await jwtVerify(token, SECRET_KEY);
    return verified.payload as SessionData;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin-session')?.value;
  
  if (!token) return null;
  
  return verifySession(token);
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  
  cookieStore.set('admin-session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/'
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('admin-session');
}
```

### 3.4 Middleware

**middleware.ts:**
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';

export async function middleware(request: NextRequest) {
  // Защита всех /admin/* роутов (кроме /admin/login)
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Разрешить доступ к /admin/login
    if (request.nextUrl.pathname === '/admin/login') {
      return NextResponse.next();
    }

    // Проверить сессию
    const session = await getSession();
    
    if (!session) {
      // Нет сессии → редирект на логин
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*'
};
```

### 3.5 Login API

**app/api/admin/auth/login/route.ts:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_CREDENTIALS } from '@/lib/auth/credentials';
import { createSession, setSessionCookie } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Проверка credentials
    if (
      username === ADMIN_CREDENTIALS.username &&
      password === ADMIN_CREDENTIALS.password
    ) {
      // Создать сессию
      const token = await createSession(username);
      
      // Установить cookie
      await setSessionCookie(token);

      return NextResponse.json({
        success: true,
        message: 'Login successful'
      });
    }

    // Неверные credentials
    return NextResponse.json(
      { success: false, error: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**app/api/admin/auth/logout/route.ts:**
```typescript
import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth/session';

export async function POST() {
  await clearSessionCookie();
  
  return NextResponse.json({
    success: true,
    message: 'Logged out successfully'
  });
}
```

---

## 4. UI/UX СПЕЦИФИКАЦИЯ

### 4.1 Страница логина

**app/admin/login/page.tsx:**

```
┌────────────────────────────────────────┐
│                                         │
│         MediaSyndicate                  │
│         Admin Panel                     │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  Username                          │ │
│  │  [boss___________________]         │ │
│  │                                    │ │
│  │  Password                          │ │
│  │  [********************]            │ │
│  │                                    │ │
│  │  [          Login          ]       │ │
│  │                                    │ │
│  │  ❌ Invalid credentials            │ │ ← Error message
│  └───────────────────────────────────┘ │
│                                         │
└────────────────────────────────────────┘
```

**Поведение:**
- Enter на password → submit
- После успешного логина → redirect на /admin/sources (или на `?from=` URL)
- Ошибка → красное сообщение под формой
- Нет регистрации, нет "forgot password"

### 4.2 Главная страница админки

**app/admin/sources/page.tsx:**

```
┌─────────────────────────────────────────────────────────────┐
│ MediaSyndicate Admin              boss  [Выйти]              │
├─────────────────────────────────────────────────────────────┤
│ УПРАВЛЕНИЕ ИСТОЧНИКАМИ                     [+ Добавить]      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 🔍 Поиск: [____________]     Тип: [RSS ▼]  Статус: [Все ▼] │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Название           │ Тип │ URL              │ Статус  │ … ││
│ ├──────────────────────────────────────────────────────────┤│
│ │ BBC Ukraine        │ RSS │ feeds.bbci.co... │ 🟢 Акт. │ …  ││
│ │   52 статьи • Последний импорт: 10 минут назад           ││
│ │   [✏️ Редактировать] [🔄 Импортировать] [🗑️ Удалить]    ││
│ │                                                          ││
│ │ Kyiv Post          │ RSS │ kyivpost.com/... │ 🟢 Акт. │ …  ││
│ │   38 статей • Последний импорт: 15 минут назад           ││
│ │   [✏️ Редактировать] [🔄 Импортировать] [🗑️ Удалить]    ││
│ │                                                          ││
│ │ Interfax-Ukraine   │ RSS │ en.interfax.com  │ 🔴 Откл.│ …  ││
│ │   0 статей • Не импортировался                           ││
│ │   [✏️ Редактировать] [🔄 Импортировать] [🗑️ Удалить]    ││
│ │                                                          ││
│ │ @pravda_ua         │ TG  │ -                │ 🟡 Скоро│ …  ││
│ │   - • Phase 3 (Telegram support)                         ││
│ │   [✏️ Редактировать] [—] [🗑️ Удалить]                   ││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
│ Показано: 4 из 4 источников                                │
└─────────────────────────────────────────────────────────────┘
```

**Особенности:**
- Expandable rows (клик → раскрывается детали)
- Real-time статус (🟢 активен, 🔴 отключен, 🟡 в разработке)
- Счетчик статей
- Последний импорт (human-readable: "10 минут назад")
- Кнопки действий: Редактировать, Импортировать, Удалить

### 4.3 Форма добавления источника

**Dialog/Modal:**

```
┌─────────────────────────────────────────┐
│ ✖️  Добавить источник                    │
├─────────────────────────────────────────┤
│                                          │
│ Тип источника: *                        │
│ (•) RSS Feed   ( ) Telegram Channel      │
│                                          │
│ ───────────────────────────────────────  │
│                                          │
│ Название: *                             │
│ [Kyiv Post____________________]         │
│ └ Отображается в UI                     │
│                                          │
│ RSS Feed URL: *                         │
│ [https://www.kyivpost.com/feed____]    │
│ └ Полный URL включая https://           │
│                                          │
│ [🧪 Тест подключения]                   │
│                                          │
│ ✅ Фид работает!                         │
│ Найдено 15 статей                       │
│ Пример: "Latest political news..."      │
│                                          │
│ ───────────────────────────────────────  │
│                                          │
│ ☑️ Активировать сразу после добавления  │
│                                          │
│ ───────────────────────────────────────  │
│                                          │
│ [Отмена]              [Добавить]        │
└─────────────────────────────────────────┘
```

**Валидация:**
- Название: обязательное, 3-100 символов
- URL: обязательное, валидный URL, https://
- Тест подключения: рекомендуется (не обязательно)

**Состояния:**
- Idle: кнопка [Добавить] неактивна до заполнения обязательных полей
- Testing: показать spinner на кнопке [Тест подключения]
- Test Success: ✅ зеленая галочка + детали
- Test Error: ❌ красная ошибка + причина
- Submitting: кнопка [Добавить] → spinner
- Success: закрыть dialog, показать toast, обновить таблицу

### 4.4 Подтверждение удаления

```
┌─────────────────────────────────────────┐
│ ⚠️  Удалить источник?                    │
├─────────────────────────────────────────┤
│                                          │
│ Вы уверены что хотите удалить источник: │
│                                          │
│  "Kyiv Post"                            │
│                                          │
│ ⚠️ Все статьи от этого источника        │
│ останутся в базе, но новые не будут     │
│ импортироваться.                         │
│                                          │
│ Это действие нельзя отменить.           │
│                                          │
│ [Отмена]                    [Удалить]   │
└─────────────────────────────────────────┘
```

---

## 5. API СПЕЦИФИКАЦИЯ

### 5.1 GET /api/admin/sources

**Цель**: Получить список всех источников

**Request:**
```
GET /api/admin/sources
Headers:
  Cookie: admin-session=xxx
```

**Response 200:**
```json
{
  "sources": [
    {
      "id": "uuid-1",
      "name": "BBC Ukraine",
      "type": "RSS",
      "url": "https://feeds.bbci.co.uk/news/world/europe/rss.xml",
      "isActive": true,
      "articlesCount": 52,
      "lastImportAt": "2024-11-27T10:30:00Z",
      "createdAt": "2024-11-22T08:00:00Z",
      "updatedAt": "2024-11-27T10:30:00Z"
    },
    {
      "id": "uuid-2",
      "name": "Kyiv Post",
      "type": "RSS",
      "url": "https://www.kyivpost.com/feed",
      "isActive": true,
      "articlesCount": 38,
      "lastImportAt": "2024-11-27T10:15:00Z",
      "createdAt": "2024-11-27T09:00:00Z",
      "updatedAt": "2024-11-27T10:15:00Z"
    }
  ],
  "total": 2
}
```

**Response 401** (нет сессии):
```json
{
  "error": "Unauthorized"
}
```

**Implementation:**
```typescript
// app/api/admin/sources/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/session';

export async function GET() {
  // Проверка сессии
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Получить источники с подсчетом статей
  const sources = await prisma.source.findMany({
    include: {
      _count: {
        select: { articles: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Получить lastImportAt для каждого источника
  const sourcesWithImport = await Promise.all(
    sources.map(async (source) => {
      const lastArticle = await prisma.article.findFirst({
        where: { sourceId: source.id },
        orderBy: { importedAt: 'desc' },
        select: { importedAt: true }
      });

      return {
        id: source.id,
        name: source.name,
        type: source.type,
        url: source.url,
        isActive: source.isActive,
        articlesCount: source._count.articles,
        lastImportAt: lastArticle?.importedAt || null,
        createdAt: source.createdAt,
        updatedAt: source.updatedAt
      };
    })
  );

  return NextResponse.json({
    sources: sourcesWithImport,
    total: sources.length
  });
}
```

### 5.2 POST /api/admin/sources

**Цель**: Создать новый источник

**Request:**
```json
POST /api/admin/sources
Headers:
  Cookie: admin-session=xxx
  Content-Type: application/json

Body:
{
  "name": "Kyiv Post",
  "type": "RSS",
  "url": "https://www.kyivpost.com/feed",
  "isActive": true
}
```

**Response 201:**
```json
{
  "success": true,
  "source": {
    "id": "uuid-new",
    "name": "Kyiv Post",
    "type": "RSS",
    "url": "https://www.kyivpost.com/feed",
    "isActive": true,
    "createdAt": "2024-11-27T11:00:00Z"
  }
}
```

**Response 400** (валидация):
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "name": "Name is required",
    "url": "Invalid URL format"
  }
}
```

**Response 409** (дубликат URL):
```json
{
  "success": false,
  "error": "Source with this URL already exists"
}
```

**Implementation:**
```typescript
// app/api/admin/sources/route.ts
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  
  // Валидация
  const schema = z.object({
    name: z.string().min(3).max(100),
    type: z.enum(['RSS', 'TELEGRAM']),
    url: z.string().url().optional(),
    telegramId: z.bigint().optional(),
    isActive: z.boolean().default(true)
  });

  const validation = schema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed',
        details: validation.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  const data = validation.data;

  // Проверка на дубликат URL
  if (data.url) {
    const existing = await prisma.source.findUnique({
      where: { url: data.url }
    });
    
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Source with this URL already exists'
        },
        { status: 409 }
      );
    }
  }

  // Создать источник
  const source = await prisma.source.create({
    data: {
      name: data.name,
      type: data.type,
      url: data.url,
      telegramId: data.telegramId,
      isActive: data.isActive
    }
  });

  return NextResponse.json(
    {
      success: true,
      source
    },
    { status: 201 }
  );
}
```

### 5.3 POST /api/admin/sources/test

**Цель**: Тестировать RSS фид БЕЗ создания источника

**Request:**
```json
POST /api/admin/sources/test
Headers:
  Cookie: admin-session=xxx
  Content-Type: application/json

Body:
{
  "url": "https://www.kyivpost.com/feed"
}
```

**Response 200** (успех):
```json
{
  "success": true,
  "itemsFound": 15,
  "sample": {
    "title": "Latest political developments in Kyiv",
    "pubDate": "2024-11-27T10:00:00Z",
    "link": "https://www.kyivpost.com/article/..."
  }
}
```

**Response 400** (ошибка парсинга):
```json
{
  "success": false,
  "error": "Failed to parse RSS feed",
  "details": "Invalid XML format"
}
```

**Response 404** (фид не найден):
```json
{
  "success": false,
  "error": "Feed not found",
  "details": "HTTP 404: Not Found"
}
```

**Implementation:**
```typescript
// app/api/admin/sources/test/route.ts
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { RSSParser } from '@/lib/services/RSSParser';
import { z } from 'zod';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  
  // Валидация
  const schema = z.object({
    url: z.string().url()
  });

  const validation = schema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid URL'
      },
      { status: 400 }
    );
  }

  try {
    // Парсить RSS
    const feed = await RSSParser.parse(validation.data.url);
    
    if (!feed.items || feed.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Feed is empty',
          details: 'No items found in the feed'
        },
        { status: 400 }
      );
    }

    // Взять первую статью как пример
    const sample = feed.items[0];

    return NextResponse.json({
      success: true,
      itemsFound: feed.items.length,
      sample: {
        title: sample.title,
        pubDate: sample.pubDate,
        link: sample.link
      }
    });
  } catch (error) {
    console.error('[RSS Test Error]:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to parse RSS feed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 400 }
    );
  }
}
```

### 5.4 POST /api/admin/sources/[id]/import

**Цель**: Запустить ручной импорт для источника

**Request:**
```
POST /api/admin/sources/uuid-1/import
Headers:
  Cookie: admin-session=xxx
```

**Response 200:**
```json
{
  "success": true,
  "imported": 12,
  "errors": 0,
  "duration": 3.5
}
```

**Response 404:**
```json
{
  "success": false,
  "error": "Source not found"
}
```

**Implementation:**
```typescript
// app/api/admin/sources/[id]/import/route.ts
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { ImportService } from '@/lib/services/ImportService';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    const result = await ImportService.importFromSource(params.id);
    
    const duration = (Date.now() - startTime) / 1000;

    return NextResponse.json({
      success: true,
      imported: result.imported,
      errors: result.errors,
      duration
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Import failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
```

### 5.5 PATCH /api/admin/sources/[id]

**Цель**: Обновить существующий источник

**Request:**
```json
PATCH /api/admin/sources/uuid-1
Headers:
  Cookie: admin-session=xxx
  Content-Type: application/json

Body:
{
  "name": "BBC Ukraine (Updated)",
  "isActive": false
}
```

**Response 200:**
```json
{
  "success": true,
  "source": {
    "id": "uuid-1",
    "name": "BBC Ukraine (Updated)",
    "isActive": false,
    ...
  }
}
```

### 5.6 DELETE /api/admin/sources/[id]

**Цель**: Удалить источник

**Request:**
```
DELETE /api/admin/sources/uuid-1
Headers:
  Cookie: admin-session=xxx
```

**Response 200:**
```json
{
  "success": true,
  "message": "Source deleted"
}
```

**Response 404:**
```json
{
  "success": false,
  "error": "Source not found"
}
```

**Implementation:**
```typescript
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await prisma.source.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Source deleted'
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Source not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Delete failed' },
      { status: 500 }
    );
  }
}
```

---

## 6. DATABASE SCHEMA

**Изменений НЕ требуется** - существующая схема Source подходит:

```prisma
model Source {
  id            String      @id @default(cuid())
  name          String
  url           String?     @unique
  type          String      // "RSS" or "TELEGRAM"
  isActive      Boolean     @default(true)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  articles      Article[]

  @@index([type])
  @@index([isActive])
}
```

**Для статистики**:
- articlesCount: `prisma.article.count({ where: { sourceId } })`
- lastImportAt: `prisma.article.findFirst({ where: { sourceId }, orderBy: { importedAt: 'desc' } })`

---

## 7. КОМПОНЕНТЫ

### 7.1 shadcn/ui Установка

```bash
# Установить shadcn/ui CLI
npx shadcn@latest init

# Добавить нужные компоненты
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add form
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add table
npx shadcn@latest add toast
npx shadcn@latest add select
npx shadcn@latest add switch
npx shadcn@latest add badge
```

### 7.2 Ключевые компоненты

#### SourceTable.tsx
```typescript
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';

interface Source {
  id: string;
  name: string;
  type: string;
  url: string | null;
  isActive: boolean;
  articlesCount: number;
  lastImportAt: string | null;
}

export function SourceTable() {
  const queryClient = useQueryClient();
  const [importingId, setImportingId] = useState<string | null>(null);

  // Fetch sources
  const { data, isLoading } = useQuery({
    queryKey: ['sources'],
    queryFn: async () => {
      const res = await fetch('/api/admin/sources');
      if (!res.ok) throw new Error('Failed to fetch sources');
      return res.json();
    }
  });

  // Manual import mutation
  const importMutation = useMutation({
    mutationFn: async (sourceId: string) => {
      setImportingId(sourceId);
      const res = await fetch(`/api/admin/sources/${sourceId}/import`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Import failed');
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Import successful',
        description: `Imported ${data.imported} articles`
      });
      queryClient.invalidateQueries({ queryKey: ['sources'] });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Import failed',
        description: 'Could not import articles'
      });
    },
    onSettled: () => {
      setImportingId(null);
    }
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Название</TableHead>
          <TableHead>Тип</TableHead>
          <TableHead>URL</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead>Статистика</TableHead>
          <TableHead>Действия</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data?.sources.map((source: Source) => (
          <TableRow key={source.id}>
            <TableCell className="font-medium">{source.name}</TableCell>
            <TableCell>
              <Badge variant="secondary">{source.type}</Badge>
            </TableCell>
            <TableCell className="max-w-xs truncate">
              {source.url || '-'}
            </TableCell>
            <TableCell>
              {source.isActive ? (
                <Badge variant="success">🟢 Активен</Badge>
              ) : (
                <Badge variant="destructive">🔴 Отключен</Badge>
              )}
            </TableCell>
            <TableCell>
              <div className="text-sm">
                {source.articlesCount} статей
                {source.lastImportAt && (
                  <div className="text-muted-foreground">
                    Импорт: {new Date(source.lastImportAt).toLocaleString('ru')}
                  </div>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => importMutation.mutate(source.id)}
                  disabled={importingId === source.id}
                >
                  {importingId === source.id ? '⏳' : '🔄'}
                </Button>
                <Button variant="outline" size="sm">✏️</Button>
                <Button variant="destructive" size="sm">🗑️</Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

#### SourceForm.tsx
```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';

const schema = z.object({
  name: z.string().min(3, 'Минимум 3 символа').max(100),
  type: z.enum(['RSS', 'TELEGRAM']),
  url: z.string().url('Неверный формат URL'),
  isActive: z.boolean().default(true)
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SourceForm({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      type: 'RSS',
      url: '',
      isActive: true
    }
  });

  // Test connection
  const handleTest = async () => {
    const url = form.getValues('url');
    if (!url) {
      toast({
        variant: 'destructive',
        title: 'Введите URL'
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/admin/sources/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({
        success: false,
        error: 'Network error'
      });
    } finally {
      setTesting(false);
    }
  };

  // Create source
  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch('/api/admin/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to create source');
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Источник добавлен',
        description: 'Новый источник успешно создан'
      });
      queryClient.invalidateQueries({ queryKey: ['sources'] });
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Не удалось добавить источник'
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Добавить источник</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Название *</Label>
              <Input
                id="name"
                {...form.register('name')}
                placeholder="Kyiv Post"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="url">RSS Feed URL *</Label>
              <Input
                id="url"
                {...form.register('url')}
                placeholder="https://www.kyivpost.com/feed"
              />
              {form.formState.errors.url && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.url.message}
                </p>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleTest}
              disabled={testing}
            >
              {testing ? '⏳ Тестирование...' : '🧪 Тест подключения'}
            </Button>

            {testResult && (
              <div
                className={`p-3 rounded ${
                  testResult.success
                    ? 'bg-green-50 text-green-900'
                    : 'bg-red-50 text-red-900'
                }`}
              >
                {testResult.success ? (
                  <>
                    <p className="font-semibold">✅ Фид работает!</p>
                    <p className="text-sm">
                      Найдено {testResult.itemsFound} статей
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Пример: {testResult.sample?.title}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold">❌ Ошибка</p>
                    <p className="text-sm">{testResult.error}</p>
                  </>
                )}
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={form.watch('isActive')}
                onCheckedChange={(checked) => form.setValue('isActive', checked)}
              />
              <Label htmlFor="isActive">Активировать сразу</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? '⏳' : 'Добавить'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 8. ИНСТРУКЦИЯ ДЛЯ CURSOR

### Фаза 1: Авторизация (30 мин)

1. **Создать lib/auth/**
```bash
mkdir -p lib/auth
touch lib/auth/credentials.ts
touch lib/auth/session.ts
```

Скопировать код из секции 3.2, 3.3

2. **Создать middleware.ts**
Скопировать код из секции 3.4

3. **Создать app/admin/login/page.tsx**
```typescript
// Форма логина с username/password
// Submit → POST /api/admin/auth/login
```

4. **Создать API routes**
```bash
mkdir -p app/api/admin/auth/login
mkdir -p app/api/admin/auth/logout
touch app/api/admin/auth/login/route.ts
touch app/api/admin/auth/logout/route.ts
```

Скопировать код из секции 3.5

5. **Тест авторизации**
```bash
npm run dev
# Открыть /admin/sources → должен редирект на /admin/login
# Ввести boss / 149521MkSF#u*V → должен пропустить
```

### Фаза 2: shadcn/ui Setup (15 мин)

```bash
npx shadcn@latest init
npx shadcn@latest add button dialog form input label table toast select switch badge
```

### Фаза 3: API Routes (1 час)

Создать все API routes из секции 5:
- GET /api/admin/sources
- POST /api/admin/sources
- POST /api/admin/sources/test
- POST /api/admin/sources/[id]/import
- PATCH /api/admin/sources/[id]
- DELETE /api/admin/sources/[id]

### Фаза 4: UI Компоненты (2 часа)

1. **app/admin/sources/page.tsx** - главная страница
2. **components/SourceTable.tsx** - таблица
3. **components/SourceForm.tsx** - форма добавления
4. **components/DeleteDialog.tsx** - подтверждение удаления

### Фаза 5: Тестирование (1 час)

Пройти все тесты из секции 9

### Фаза 6: Deploy

```bash
git add .
git commit -m "feat: admin panel for sources management"
git push origin main
# Dokploy автоматически deploy
```

---

## 9. ПЛАН ТЕСТИРОВАНИЯ

### Test 1: Авторизация
```
1. Открыть https://mediasyndicate.online/admin/sources
2. Должен редирект на /admin/login
3. Ввести неверные credentials → ошибка
4. Ввести boss / 149521MkSF#u*V → успех → редирект на /admin/sources
5. Обновить страницу → должен остаться залогинен
6. Click [Выйти] → редирект на /admin/login
```

### Test 2: Просмотр списка
```
1. Залогиниться
2. Открыть /admin/sources
3. Должна показаться таблица с текущими источниками
4. Проверить что все поля отображаются корректно
```

### Test 3: Добавление источника
```
1. Click [+ Добавить]
2. Заполнить форму:
   - Название: Test Source
   - URL: https://www.kyivpost.com/feed
3. Click [Тест подключения]
4. Должно показать ✅ с количеством статей
5. Click [Добавить]
6. Источник должен появиться в таблице
```

### Test 4: Ручной импорт
```
1. Click [🔄] на любом источнике
2. Должен показать прогресс
3. После завершения → показать toast с результатом
4. Счетчик статей должен обновиться
```

### Test 5: Редактирование
```
1. Click [✏️] на источнике
2. Изменить название
3. Click [Сохранить]
4. Название должно обновиться в таблице
```

### Test 6: Удаление
```
1. Click [🗑️] на источнике
2. Должен показаться dialog подтверждения
3. Click [Удалить]
4. Источник должен исчезнуть из таблицы
```

---

## 10. КРИТЕРИИ ПРИЕМКИ

### Функциональные
- [ ] Авторизация работает (boss / 149521MkSF#u*V)
- [ ] Middleware защищает /admin/*
- [ ] Таблица источников отображается
- [ ] Можно добавить новый источник
- [ ] Тест RSS подключения работает
- [ ] Ручной импорт работает
- [ ] Редактирование работает
- [ ] Удаление работает (с подтверждением)
- [ ] Logout работает

### Нефункциональные
- [ ] UI использует shadcn/ui
- [ ] Формы валидируются через Zod
- [ ] Ошибки показываются пользователю (toasts)
- [ ] Loading states для всех async операций
- [ ] Responsive design (работает на мобильных)

### Безопасность
- [ ] Все /admin/* роуты защищены
- [ ] Session cookie HttpOnly
- [ ] Credentials НЕ в .env (hardcoded в коде)
- [ ] Logout очищает сессию

---

**ГОТОВО К РЕАЛИЗАЦИИ**

Andy, всё согласовано? Даю задание Cursor?