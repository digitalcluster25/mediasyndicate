# CURSOR: ПОЛНОСТЬЮ ОТКЛЮЧИТЬ АВТОРИЗАЦИЮ НА ВРЕМЯ РАЗРАБОТКИ

## ЦЕЛЬ
Убрать ВСЮ авторизацию чтобы сфокусироваться на функциональности.
Вернём auth позже когда всё заработает.

---

## ШАГ 1: Упростить middleware.ts

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Отключена авторизация для разработки
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}

export const config = {
  matcher: '/adminko/:path*'
};
```

---

## ШАГ 2: Упростить app/adminko/sources/layout.tsx

```typescript
'use client';

import Link from 'next/link';

export default function SourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/adminko/sources" className="text-xl font-bold">
                MediaSyndicate Admin
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">dev-mode</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
```

---

## ШАГ 3: Убрать проверки из API routes

### app/api/admin/sources/route.ts

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// import { getSession } from '@/lib/auth/session'; // ЗАКОММЕНТИРОВАНО
import { z } from 'zod';

export async function GET() {
  // АВТОРИЗАЦИЯ ОТКЛЮЧЕНА ДЛЯ РАЗРАБОТКИ
  // const session = await getSession();
  // if (!session) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  // ... остальной код БЕЗ ИЗМЕНЕНИЙ
}

export async function POST(request: NextRequest) {
  // АВТОРИЗАЦИЯ ОТКЛЮЧЕНА ДЛЯ РАЗРАБОТКИ
  // const session = await getSession();
  // if (!session) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  // ... остальной код БЕЗ ИЗМЕНЕНИЙ
}
```

### app/api/admin/sources/test/route.ts

```typescript
export async function POST(request: NextRequest) {
  // АВТОРИЗАЦИЯ ОТКЛЮЧЕНА
  // const session = await getSession();
  // if (!session) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  // ... остальной код
}
```

### app/api/admin/sources/[id]/route.ts

```typescript
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  // АВТОРИЗАЦИЯ ОТКЛЮЧЕНА
  // const session = await getSession();
  // if (!session) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  // ... остальной код
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  // АВТОРИЗАЦИЯ ОТКЛЮЧЕНА
  // const session = await getSession();
  // if (!session) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  // ... остальной код
}
```

### app/api/admin/sources/[id]/import/route.ts

```typescript
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  // АВТОРИЗАЦИЯ ОТКЛЮЧЕНА
  // const session = await getSession();
  // if (!session) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  // ... остальной код
}
```

---

## ШАГ 4: Убрать credentials из fetch (опционально)

Можно оставить `credentials: 'include'` - не навредит.
Или убрать если хочешь упростить.

---

## ШАГ 5: Тест локально

```bash
npm run dev
```

1. Открой http://localhost:3000/adminko/sources
2. Страница должна загрузиться БЕЗ редиректа
3. API должны работать БЕЗ 401
4. Проверь через Chrome DevTools

---

## ШАГ 6: Commit

```bash
git add .
git commit -m "dev: disable auth for development

Auth will be restored after all functionality works:
- Middleware: no auth checks
- Layout: simplified, no session
- API routes: auth checks commented out
- Direct access to /adminko/sources"

git push origin main
```

---

## КРИТЕРИИ

- [ ] Middleware пропускает всё
- [ ] Layout простой без auth
- [ ] Все API без проверок сессии
- [ ] npm run dev работает
- [ ] /adminko/sources открывается
- [ ] API возвращают 200 (не 401)
- [ ] Нет ошибок в консоли
- [ ] Git push успешен

---

## ВАЖНО!

**ПОСЛЕ ВЫПОЛНЕНИЯ:**
1. Перейди сразу к тестированию функциональности
2. Добавление источников
3. Импорт статей
4. Удаление источников

**АВТОРИЗАЦИЮ ВЕРНЁМ ПОТОМ** когда всё заработает!

НЕ ОСТАНАВЛИВАЙСЯ ПОКА /adminko/sources не откроется без ошибок!
