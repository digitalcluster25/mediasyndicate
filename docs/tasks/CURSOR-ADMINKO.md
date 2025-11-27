# CURSOR: Исправить логин + переместить админку на /adminko

## ПРОБЛЕМЫ
1. Network error при логине
2. Нужно переместить всё на /adminko

## РЕШЕНИЕ
Исправить login page + переименовать все пути.

---

## ШАГ 1: Исправить app/admin-login/page.tsx

Открой `app/admin-login/page.tsx` и замени fetch на:

```typescript
const res = await fetch('/api/admin/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // ВАЖНО! Для cookies
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
  router.refresh(); // ВАЖНО! Обновить сессию
} else {
  setError(data.error || 'Login failed');
}
```

---

## ШАГ 2: Переименовать папки

```bash
# Переименовать admin-login → adminko-login
mv app/admin-login app/adminko-login

# Переименовать admin → adminko (sources и layout)
mv app/admin app/adminko
```

---

## ШАГ 3: Обновить middleware.ts

Открой `middleware.ts`:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from '@/lib/auth/session';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Пропустить /adminko-login
  if (path === '/adminko-login' || path.startsWith('/adminko-login/')) {
    return NextResponse.next();
  }
  
  // Проверить сессию для /adminko/*
  if (path.startsWith('/adminko/')) {
    const token = request.cookies.get('admin-session')?.value;
    
    if (!token) {
      const loginUrl = new URL('/adminko-login', request.url);
      loginUrl.searchParams.set('from', path);
      return NextResponse.redirect(loginUrl);
    }
    
    const session = await verifySession(token);
    
    if (!session) {
      const loginUrl = new URL('/adminko-login', request.url);
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

## ШАГ 4: Обновить app/adminko/layout.tsx

Открой `app/adminko/layout.tsx` и измени:

```typescript
// Редирект на /adminko-login
if (!session) {
  redirect('/adminko-login');
}

// Ссылки
<Link href="/adminko/sources" className="text-xl font-bold">
  MediaSyndicate Admin
</Link>

<Link
  href="/api/admin/auth/logout"
  className="text-sm text-red-600 hover:text-red-800"
>
  Выйти
</Link>
```

---

## ШАГ 5: Обновить logout API

Открой `app/api/admin/auth/logout/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth/session';

export async function GET() {
  await clearSessionCookie();
  return NextResponse.redirect(new URL('/adminko-login', process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'));
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

## ШАГ 6: Обновить все ссылки в app/adminko/sources/

Найди все упоминания `/admin/` и замени на `/adminko/`

---

## ШАГ 7: Тест локально

```bash
npm run dev
```

1. Открой http://localhost:3000/adminko-login
2. Введи: boss / 149521MkSF#u*V
3. Должен открыться http://localhost:3000/adminko/sources
4. Logout должен работать

---

## ШАГ 8: Commit

```bash
git add .
git commit -m "fix: login network error + move admin to /adminko

- Add credentials: include to fetch
- Add router.refresh() after login
- Rename /admin-login → /adminko-login
- Rename /admin → /adminko
- Update middleware matcher
- Update all redirects and links"

git push origin main
```

---

## КРИТЕРИИ ПРИЕМКИ

- [ ] npm run dev работает
- [ ] /adminko-login открывается
- [ ] Логин работает (boss / password)
- [ ] /adminko/sources открывается
- [ ] Logout работает
- [ ] Git push успешен
- [ ] Production работает

НЕ ОСТАНАВЛИВАЙСЯ пока все ✅!
