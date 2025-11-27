# CURSOR: Предотвратить проблемы с кэшем админки

## ПРОБЛЕМА
При изменении путей (/admin → /adminko) остаются старые cookies и кэш браузера.
Пользователь видит 502 пока не очистит кэш вручную.

## РЕШЕНИЕ
1. Добавить правильные Cache-Control headers
2. Очищать старые cookies автоматически
3. Установить версию для cookies

---

## ШАГ 1: Обновить middleware.ts

Добавь в начало файла:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Очистить старые cookies от /admin-login если они есть
  const hasOldCookie = request.cookies.has('admin-session-old');
  let response: NextResponse;
  
  // Пропустить логин
  if (path === '/adminko') {
    response = NextResponse.next();
    
    // Установить правильные headers для админки
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  }
  
  // Для /adminko/* проверить cookie
  if (path.startsWith('/adminko/')) {
    const token = request.cookies.get('admin-session')?.value;
    
    if (!token) {
      const loginUrl = new URL('/adminko', request.url);
      loginUrl.searchParams.set('from', path);
      response = NextResponse.redirect(loginUrl);
      
      // Установить no-cache headers
      response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
      
      return response;
    }
    
    // Cookie есть - пропустить с правильными headers
    response = NextResponse.next();
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/adminko/:path*'
};
```

---

## ШАГ 2: Обновить lib/auth/session.ts

Добавь версию для cookies:

```typescript
const COOKIE_NAME = 'admin-session';
const COOKIE_VERSION = 'v2'; // Увеличивай при изменении структуры

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  
  // Очистить старые версии
  cookieStore.delete('admin-session-v1');
  
  cookieStore.set(`${COOKIE_NAME}-${COOKIE_VERSION}`, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/'
  });
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(`${COOKIE_NAME}-${COOKIE_VERSION}`)?.value;
  
  if (!token) return null;
  
  return verifySession(token);
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  
  // Очистить все возможные версии
  cookieStore.delete(COOKIE_NAME);
  cookieStore.delete(`${COOKIE_NAME}-v1`);
  cookieStore.delete(`${COOKIE_NAME}-${COOKIE_VERSION}`);
}
```

---

## ШАГ 3: Добавить next.config.js headers

Создай/обнови `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Для всех админских страниц
        source: '/adminko/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

---

## ШАГ 4: Обновить API login

В `app/api/admin/auth/login/route.ts` используй новую версию cookie:

```typescript
// Должно автоматически использовать setSessionCookie с версией
await setSessionCookie(token);
```

---

## ТЕСТ ЛОКАЛЬНО

```bash
# Запустить
npm run dev

# Открыть в Incognito
open http://localhost:3000/adminko

# Проверить headers в DevTools:
# Network → adminko → Response Headers
# Должны быть: Cache-Control: no-cache, no-store
```

---

## COMMIT

```bash
git add .
git commit -m "fix: prevent cache issues for admin panel

- Add Cache-Control headers for /adminko
- Version cookies (v2) for migration
- Clear old cookies automatically
- Add next.config.js headers
- Prevents 502 after path changes"

git push origin main
```

---

## КРИТЕРИИ

- [ ] middleware добавляет Cache-Control headers
- [ ] cookies имеют версию
- [ ] next.config.js создан
- [ ] npm run dev работает
- [ ] Инспектор показывает правильные headers
- [ ] Git push успешен

---

## ЧТО ЭТО ДАЁТ

1. **No-cache headers** → браузер не кэширует админку
2. **Версия cookies** → при изменениях старые cookies игнорируются
3. **Автоочистка** → middleware удаляет старые cookies
4. **Предотвращение 502** → пользователи не видят старый кэш

**В БУДУЩЕМ:** При изменении путей просто увеличивай `COOKIE_VERSION` в session.ts
