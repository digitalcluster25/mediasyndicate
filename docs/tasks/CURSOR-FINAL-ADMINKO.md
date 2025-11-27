# CURSOR: ФИНАЛЬНАЯ ПРАВИЛЬНАЯ ЗАДАЧА - Админка на /adminko

## КОРНЕВАЯ ПРОБЛЕМА
1. Папка `app/admin-login` существует, но нужна `app/adminko` С ЛОГИНОМ ВНУТРИ
2. Логин должен быть на `/adminko` (без `-login`)
3. Источники на `/adminko/sources`

## АРХИТЕКТУРА (как должно быть)
```
app/
  adminko/
    page.tsx          ← ЛОГИН ЗДЕСЬ (на /adminko)
    layout.tsx        ← Layout для защищённых страниц
    sources/
      page.tsx        ← Список источников (на /adminko/sources)
      components/
```

---

## ШАГ 1: УДАЛИТЬ СТАРЫЕ ПАПКИ

```bash
rm -rf app/admin-login
rm -rf app/admin  # если есть
```

---

## ШАГ 2: СОЗДАТЬ ПРАВИЛЬНУЮ СТРУКТУРУ

### app/adminko/page.tsx (ЛОГИН)

```typescript
'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (data.success) {
        const from = searchParams.get('from') || '/adminko/sources';
        router.push(from);
        router.refresh();
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Check console.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-3xl font-bold">MediaSyndicate</h2>
          <p className="mt-2 text-gray-600">Admin Panel</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              ❌ {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
```

### app/adminko/layout.tsx

```typescript
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Только для /adminko/sources и других защищённых страниц
  // /adminko (логин) пропускается
  const session = await getSession();

  return <>{children}</>;
}
```

### app/adminko/sources/layout.tsx (ЗАЩИЩЁННЫЙ LAYOUT)

```typescript
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function SourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/adminko?from=/adminko/sources');
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
              <span className="text-sm text-gray-600">{session.username}</span>
              <Link
                href="/api/admin/auth/logout"
                className="text-sm text-red-600 hover:text-red-800"
              >
                Выйти
              </Link>
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

## ШАГ 3: ОБНОВИТЬ MIDDLEWARE

### middleware.ts

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from '@/lib/auth/session';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Пропустить логин
  if (path === '/adminko') {
    return NextResponse.next();
  }
  
  // Проверить сессию для /adminko/*
  if (path.startsWith('/adminko/')) {
    const token = request.cookies.get('admin-session')?.value;
    
    if (!token) {
      const loginUrl = new URL('/adminko', request.url);
      loginUrl.searchParams.set('from', path);
      return NextResponse.redirect(loginUrl);
    }
    
    const session = await verifySession(token);
    
    if (!session) {
      const loginUrl = new URL('/adminko', request.url);
      loginUrl.searchParams.set('from', path);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/adminko/:path*'
};
```

---

## ШАГ 4: ОБНОВИТЬ LOGOUT API

### app/api/admin/auth/logout/route.ts

```typescript
import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth/session';

export async function GET() {
  await clearSessionCookie();
  
  // Редирект на логин
  return NextResponse.redirect(
    new URL('/adminko', process.env.NEXT_PUBLIC_URL || 'http://localhost:3000')
  );
}

export async function POST() {
  await clearSessionCookie();
  
  return NextResponse.json({
    success: true,
    message: 'Logged out successfully'
  });
}
```

---

## ШАГ 5: ЛОКАЛЬНОЕ ТЕСТИРОВАНИЕ (ОБЯЗАТЕЛЬНО!)

```bash
# Запустить dev server
npm run dev

# Открыть браузер
open http://localhost:3000/adminko
```

### Тесты (выполнить ВСЕ перед commit):

1. ✅ `/adminko` открывается (форма логина)
2. ✅ Ввести неверный пароль → показать ошибку
3. ✅ Ввести boss / 149521MkSF#u*V → успех
4. ✅ Редирект на `/adminko/sources`
5. ✅ Страница sources показывается с навигацией
6. ✅ Кнопка "Выйти" работает → редирект на `/adminko`
7. ✅ Попытка открыть `/adminko/sources` без логина → редирект на `/adminko?from=/adminko/sources`
8. ✅ После логина редирект на `/adminko/sources` (из query param)

**ЕСЛИ ХОТЯ БЫ ОДИН ТЕСТ НЕ ПРОШЁЛ - НЕ ДЕЛАЙ COMMIT!**

---

## ШАГ 6: BUILD TEST (ОБЯЗАТЕЛЬНО!)

```bash
npm run build
```

**Должно быть:**
- ✅ Build successful
- ✅ 0 errors
- ✅ 0 warnings

**ЕСЛИ BUILD ПРОВАЛИЛСЯ - ИСПРАВЬ И ПОВТОРИ ШАГ 5!**

---

## ШАГ 7: COMMIT И PUSH

```bash
git add .
git commit -m "fix: complete admin restructure to /adminko

- Login page at /adminko (not /adminko-login)
- Sources at /adminko/sources
- Protected layout in sources/layout.tsx
- Updated middleware matcher
- All local tests passed
- Build successful"

git push origin main
```

---

## КРИТЕРИИ ПРИЕМКИ

### Локально:
- [ ] npm run dev работает
- [ ] /adminko показывает форму логина
- [ ] Логин работает (boss / 149521MkSF#u*V)
- [ ] Редирект на /adminko/sources
- [ ] Sources page отображается
- [ ] Logout работает
- [ ] npm run build успешен
- [ ] Все 8 тестов пройдены

### Production:
- [ ] Git push успешен
- [ ] Dokploy build успешен
- [ ] https://mediasyndicate.online/adminko открывается
- [ ] Логин работает
- [ ] /adminko/sources доступен после логина

---

## ВАЖНО!

**НЕ ДЕЛАЙ COMMIT ПОКА:**
1. Все локальные тесты не пройдены
2. npm run build не успешен
3. Ты не проверил каждую страницу в браузере

**ЭТО ФИНАЛЬНАЯ ЗАДАЧА. ПОСЛЕ НЕЁ ВСЁ ДОЛЖНО РАБОТАТЬ.**
