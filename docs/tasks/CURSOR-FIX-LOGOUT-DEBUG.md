# CURSOR: FIX - Logout не работает + добавить debug

## ПРОБЛЕМЫ
1. Logout Link не отправляет cookies
2. 401 на API (нужен debug для проверки cookies)

## РЕШЕНИЕ
1. Сделать Logout client-side кнопкой
2. Добавить debug endpoint

---

## ШАГ 1: Исправить app/adminko/sources/layout.tsx

**БЫЛО (серверный):**
```typescript
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function SourcesLayout({ children }) {
  const session = await getSession();
  if (!session) redirect('/adminko?from=/adminko/sources');

  return (
    // ... nav с Link на logout
  );
}
```

**СТАЛО (клиентский):**
```typescript
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [username, setUsername] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверить сессию
    fetch('/api/admin/auth/check', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setUsername(data.username);
        } else {
          router.push('/adminko?from=/adminko/sources');
        }
      })
      .catch(() => {
        router.push('/adminko?from=/adminko/sources');
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      router.push('/adminko');
      router.refresh();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

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
              <span className="text-sm text-gray-600">{username}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Выйти
              </button>
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

## ШАГ 2: Создать app/api/admin/auth/check/route.ts

```typescript
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

export async function GET() {
  const session = await getSession();

  if (session) {
    return NextResponse.json({
      authenticated: true,
      username: session.username
    });
  }

  return NextResponse.json(
    { authenticated: false },
    { status: 401 }
  );
}
```

---

## ШАГ 3: Обновить app/api/admin/auth/logout/route.ts

```typescript
import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth/session';

// Убрать GET метод - только POST
export async function POST() {
  await clearSessionCookie();
  
  return NextResponse.json({
    success: true,
    message: 'Logged out successfully'
  });
}
```

---

## ШАГ 4 (OPTIONAL): Debug endpoint

Создай `app/api/admin/debug/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  const session = await getSession();
  
  // Получить все cookies
  const cookies = request.cookies.getAll();
  
  return NextResponse.json({
    session: session || null,
    cookies: cookies.map(c => ({ name: c.name, hasValue: !!c.value })),
    headers: {
      cookie: request.headers.get('cookie') || 'none'
    }
  });
}
```

---

## ТЕСТ ЛОКАЛЬНО

```bash
npm run dev
```

1. Открой http://localhost:3000/adminko
2. Залогинься
3. Проверь /adminko/sources
4. Проверь Debug: http://localhost:3000/api/admin/debug
5. Нажми "Выйти" - должно работать!

---

## COMMIT

```bash
git add .
git commit -m "fix: logout button with credentials + add auth check API

- Convert sources layout to client component
- Add handleLogout with fetch POST + credentials
- Add /api/admin/auth/check endpoint
- Remove GET from logout (only POST)
- Add debug endpoint for cookie inspection"

git push origin main
```

---

## КРИТЕРИИ

- [ ] Layout клиентский
- [ ] Logout кнопка работает
- [ ] /api/admin/auth/check создан
- [ ] /api/admin/debug показывает cookies
- [ ] npm run dev работает
- [ ] Git push успешен

НЕ ОСТАНАВЛИВАЙСЯ пока logout не заработает!
