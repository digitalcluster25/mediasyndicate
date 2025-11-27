# CURSOR: FIX - middleware ломается из-за jose (EvalError)

## ПРОБЛЕМА
```
EvalError: Code generation from strings disallowed for this context
```

**ПРИЧИНА:** `jose` library использует `eval()` который запрещён в Edge Runtime.

## РЕШЕНИЕ
Убрать `verifySession` из middleware. Проверять только наличие cookie.

---

## ИСПРАВЬ middleware.ts

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Пропустить логин
  if (path === '/adminko') {
    return NextResponse.next();
  }
  
  // Для /adminko/* проверить наличие cookie (НЕ валидность!)
  if (path.startsWith('/adminko/')) {
    const token = request.cookies.get('admin-session')?.value;
    
    // Если cookie нет - редирект
    if (!token) {
      const loginUrl = new URL('/adminko', request.url);
      loginUrl.searchParams.set('from', path);
      return NextResponse.redirect(loginUrl);
    }
    
    // Cookie есть - пропустить
    // Валидность проверится в layout через getSession()
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/adminko/:path*'
};
```

**ВАЖНО:** Убрал `import { verifySession }` и `await verifySession(token)`

---

## ТЕСТ ЛОКАЛЬНО

```bash
# Очистить build
rm -rf .next

# Запустить dev
npm run dev

# Открыть
open http://localhost:3000/adminko
```

### Проверки:
1. ✅ Middleware компилируется БЕЗ ошибок
2. ✅ /adminko открывается (форма логина)
3. ✅ Логин работает
4. ✅ /adminko/sources открывается

---

## COMMIT

```bash
git add middleware.ts
git commit -m "fix: remove jose from middleware (edge runtime incompatible)

- Middleware only checks cookie presence
- JWT validation moved to layout (getSession)
- Fixes EvalError in dev mode"

git push origin main
```

---

## КРИТЕРИИ

- [ ] npm run dev работает БЕЗ EvalError
- [ ] /adminko открывается
- [ ] Логин работает
- [ ] /adminko/sources защищён

НЕ ОСТАНАВЛИВАЙСЯ пока dev не запустится без ошибок!
