# CURSOR: FIX - Бесконечный редирект /admin/login

## ❌ ПРОБЛЕМА
Middleware использует `getSession()` который вызывает `await cookies()` - это не работает в middleware контексте Next.js 15.

## ✅ РЕШЕНИЕ
Читать cookie напрямую из `request.cookies` в middleware.

---

## ИСПРАВЛЕНИЕ

### Шаг 1: Открой `middleware.ts`

### Шаг 2: Замени ВСЁ содержимое на:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from '@/lib/auth/session';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Пропустить /admin/login БЕЗ проверки
  if (path === '/admin/login') {
    return NextResponse.next();
  }
  
  // Для всех остальных /admin/* - проверить сессию
  if (path.startsWith('/admin')) {
    // ВАЖНО: Читаем cookie из request, НЕ через getSession()!
    const token = request.cookies.get('admin-session')?.value;
    
    if (!token) {
      // Нет токена → редирект на логин
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', path);
      return NextResponse.redirect(loginUrl);
    }
    
    // Проверить валидность токена
    const session = await verifySession(token);
    
    if (!session) {
      // Токен невалиден → редирект на логин  
      const loginUrl = new URL('/admin/login', request.url);
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

### КЛЮЧЕВЫЕ ИЗМЕНЕНИЯ:
1. ❌ Убрали `getSession()` из middleware
2. ✅ Читаем cookie напрямую: `request.cookies.get('admin-session')`
3. ✅ Используем только `verifySession(token)` для проверки

---

## Шаг 3: Тестируй локально

```bash
npm run dev
```

Открой: http://localhost:3000/admin/login
Должна открыться форма БЕЗ редиректов.

---

## Шаг 4: Commit и Push

```bash
git add middleware.ts
git commit -m "fix: middleware infinite redirect - use request.cookies instead of getSession()"
git push origin main
```

---

## Шаг 5: Подожди деплой (2 мин)

---

## Шаг 6: Проверка на production

Открой в браузере: https://mediasyndicate.online/admin/login

**Должно работать:**
- ✅ /admin/login открывается
- ✅ Форма логина видна
- ✅ Можно ввести boss / 149521MkSF#u*V
- ✅ После логина редирект на /admin/sources

---

## ✅ КРИТЕРИИ ПРИЕМКИ

- [ ] npm run dev - работает локально
- [ ] /admin/login открывается БЕЗ редиректов
- [ ] /admin/sources редиректит на /admin/login (если не залогинен)
- [ ] Логин работает (boss / 149521MkSF#u*V)
- [ ] После логина открывается /admin/sources
- [ ] Git push успешен
- [ ] Production работает

**НЕ ОСТАНАВЛИВАЙСЯ пока все ✅ не выполнены!**
