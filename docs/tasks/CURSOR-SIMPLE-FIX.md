# CURSOR: ПРОСТОЙ FIX - middleware ломает /admin-login

## ПРОБЛЕМА
middleware проверяет `path.startsWith('/admin')` - это ловит `/admin-login`!

## РЕШЕНИЕ
Изменить на `path.startsWith('/admin/')` (с слэшем в конце)

---

## ИСПРАВЬ middleware.ts

Открой `middleware.ts` и измени ОДНУ строку:

**БЫЛО:**
```typescript
if (path.startsWith('/admin')) {
```

**СТАЛО:**
```typescript
if (path.startsWith('/admin/')) {
```

Вот полный правильный код:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from '@/lib/auth/session';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Пропустить /admin-login
  if (path === '/admin-login' || path.startsWith('/admin-login/')) {
    return NextResponse.next();
  }
  
  // ВАЖНО: /admin/ с слэшем - не ловит /admin-login
  if (path.startsWith('/admin/')) {
    const token = request.cookies.get('admin-session')?.value;
    
    if (!token) {
      const loginUrl = new URL('/admin-login', request.url);
      loginUrl.searchParams.set('from', path);
      return NextResponse.redirect(loginUrl);
    }
    
    const session = await verifySession(token);
    
    if (!session) {
      const loginUrl = new URL('/admin-login', request.url);
      loginUrl.searchParams.set('from', path);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*'
};
```

## COMMIT И PUSH

```bash
git add middleware.ts
git commit -m "fix: middleware - add slash to prevent matching /admin-login"
git push origin main
```

## ВСЕГО ОДНА СТРОКА ИЗМЕНЕНА!
