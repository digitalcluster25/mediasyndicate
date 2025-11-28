# CURSOR: ВРЕМЕННО ОТКЛЮЧИТЬ АВТОРИЗАЦИЮ ДЛЯ ТЕСТИРОВАНИЯ

## ПРОБЛЕМА
Невозможно протестировать /adminko/sources из-за проблем с авторизацией.
Скачивается source.txt вместо отображения страницы.

## ЗАДАЧА
1. ВРЕМЕННО отключить авторизацию
2. Протестировать через Chrome DevTools MCP
3. Исправить все ошибки
4. Вернуть авторизацию

---

## ШАГ 1: Отключить проверку в middleware.ts

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // ВРЕМЕННО: пропускать всё для тестирования
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
  
  /* ЗАКОММЕНТИРОВАНО ДЛЯ ТЕСТИРОВАНИЯ
  if (path === '/adminko') {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  }
  
  if (path.startsWith('/adminko/')) {
    const token = request.cookies.get('admin-session-v2')?.value || request.cookies.get('admin-session')?.value;
    
    if (!token) {
      const loginUrl = new URL('/adminko', request.url);
      loginUrl.searchParams.set('from', path);
      const response = NextResponse.redirect(loginUrl);
      response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
      return response;
    }
    
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    return response;
  }
  */

  return NextResponse.next();
}

export const config = {
  matcher: '/adminko/:path*'
};
```

---

## ШАГ 2: Отключить проверку в sources/layout.tsx

```typescript
'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    router.push('/adminko');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/adminko/sources" className="text-xl font-bold">
                MediaSyndicate Admin (NO AUTH - TESTING)
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">test-user</span>
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

## ШАГ 3: Отключить проверку в API routes

**app/api/admin/sources/route.ts:**

```typescript
export async function GET() {
  // ВРЕМЕННО: закомментировать проверку сессии
  /*
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  */
  
  // ... остальной код
}

export async function POST(request: NextRequest) {
  // ВРЕМЕННО: закомментировать проверку
  /*
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  */
  
  // ... остальной код
}
```

**Сделай то же самое для:**
- `app/api/admin/sources/test/route.ts`
- `app/api/admin/sources/[id]/route.ts`
- `app/api/admin/sources/[id]/import/route.ts`

---

## ШАГ 4: Запустить и протестировать

```bash
npm run dev
```

### Используй Chrome DevTools MCP для тестирования:

1. **Открой страницу:**
```javascript
// Используй Control Chrome MCP
open_url("http://localhost:3000/adminko/sources")
```

2. **Проверь что загружается:**
```javascript
get_page_content()
```

3. **Проверь консоль на ошибки:**
```javascript
execute_javascript(`
  console.log('Page loaded');
  // Проверить ошибки
  window.addEventListener('error', (e) => console.error('Error:', e));
`)
```

4. **Проверь Network:**
```javascript
execute_javascript(`
  // Получить все failed requests
  performance.getEntriesByType('resource')
    .filter(r => r.responseStatus >= 400)
    .map(r => ({ url: r.name, status: r.responseStatus }))
`)
```

5. **Проверь что рендерится:**
```javascript
execute_javascript(`
  ({
    title: document.title,
    hasTable: !!document.querySelector('table'),
    hasButton: !!document.querySelector('button'),
    bodyText: document.body.innerText.substring(0, 500),
    errors: Array.from(document.querySelectorAll('.error, [class*="error"]')).map(e => e.textContent)
  })
`)
```

---

## ШАГ 5: НАЙДИ И ИСПРАВЬ ОШИБКИ

Посмотри что показывает Chrome DevTools:
- Какие ошибки в консоли?
- Какие requests failed?
- Что в Network tab?
- Рендерится ли страница правильно?

**ИСПРАВЬ ВСЁ ЧТО НАЙДЁШЬ!**

---

## ШАГ 6: После исправления - ВЕРНУТЬ АВТОРИЗАЦИЮ

1. Раскомментируй все проверки в middleware.ts
2. Раскомментируй проверки в layout.tsx (вернуть useEffect)
3. Раскомментируй проверки во всех API routes
4. Протестируй с авторизацией

---

## COMMIT

```bash
# После успешного тестирования БЕЗ auth
git add .
git commit -m "temp: disable auth for testing (REVERT THIS AFTER FIXING)"

# После исправления и возврата auth
git add .
git commit -m "fix: [описание исправлений] + restore auth"

git push origin main
```

---

## КРИТЕРИИ

### Фаза 1 (БЕЗ авторизации):
- [ ] Авторизация отключена везде
- [ ] npm run dev работает
- [ ] /adminko/sources открывается
- [ ] Chrome DevTools показывает ошибки
- [ ] ВСЕ ошибки найдены и записаны

### Фаза 2 (Исправления):
- [ ] ВСЕ ошибки исправлены
- [ ] Страница рендерится правильно
- [ ] API endpoints работают
- [ ] Нет ошибок в консоли

### Фаза 3 (Возврат auth):
- [ ] Авторизация возвращена
- [ ] Всё работает с auth
- [ ] Git push успешен

---

## ВАЖНО!

**ИСПОЛЬЗУЙ CHROME DEVTOOLS MCP ДЛЯ ТЕСТИРОВАНИЯ!**

Не просто смотри в браузер - используй MCP чтобы:
- Читать консоль программно
- Проверять Network requests
- Инспектировать DOM
- Находить ошибки автоматически

**НЕ ОСТАНАВЛИВАЙСЯ ПОКА ВСЁ НЕ ЗАРАБОТАЕТ!**
