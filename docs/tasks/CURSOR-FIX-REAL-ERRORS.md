# CURSOR: ИСПРАВИТЬ КРИТИЧЕСКИЕ ОШИБКИ - НЕ КОММИТИТЬ БЕЗ ТЕСТОВ!

## ❌ НАЙДЕННЫЕ ОШИБКИ (РЕАЛЬНЫЕ ЛОГИ):

### ОШИБКА 1: EvalError в middleware
```
⨯ EvalError: Code generation from strings disallowed for this context
   at .next/server/middleware.js:29
```
**ПРИЧИНА:** Middleware всё ещё импортирует что-то с eval()

### ОШИБКА 2: react-dom отсутствует
```
Module not found: Can't resolve 'react-dom/client'
Cannot find module 'react-dom/server.browser'
```

---

## ИСПРАВЛЕНИЕ

### ШАГ 1: Проверить middleware.ts

Открой `middleware.ts` и убедись что НЕТ импортов:
```typescript
// ❌ УБЕРИ ВСЕ ИМПОРТЫ auth если есть
// import { verifySession } from '@/lib/auth/session';
// import { getSession } from '@/lib/auth/session';

// ✅ ДОЛЖНО БЫТЬ ТОЛЬКО:
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
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

### ШАГ 2: Установить react-dom

```bash
npm install react-dom
```

### ШАГ 3: Очистить .next

```bash
rm -rf .next
```

---

## ОБЯЗАТЕЛЬНОЕ ТЕСТИРОВАНИЕ!

### ШАГ 4: Запустить dev

```bash
npm run dev
```

**ПРОВЕРЬ ЛОГИ:**
- ✅ Должно быть: "Ready in X.Xs"
- ❌ НЕ должно быть: "EvalError"
- ❌ НЕ должно быть: "Cannot find module"

### ШАГ 5: Протестировать в браузере

```bash
# В отдельном терминале
curl -s http://localhost:3000/adminko/sources | head -c 500
```

**ДОЛЖЕН вернуть HTML** (не пустоту!)

### ШАГ 6: Открыть в Chrome DevTools

**ИСПОЛЬЗУЙ CHROME DEVTOOLS MCP:**

```javascript
// 1. Открой страницу
open_url("http://localhost:3000/adminko/sources")

// 2. Проверь что загрузилось
execute_javascript(`
({
  title: document.title,
  hasNav: !!document.querySelector('nav'),
  hasMediaSyndicate: document.body.innerText.includes('MediaSyndicate'),
  bodyStart: document.body.innerText.substring(0, 300)
})
`)

// 3. Проверь консоль на ошибки
execute_javascript(`
  window.errors = [];
  window.addEventListener('error', e => window.errors.push(e.message));
  setTimeout(() => console.log('Errors:', window.errors), 1000);
`)

// 4. Проверь Network failed requests
execute_javascript(`
  performance.getEntriesByType('resource')
    .filter(r => r.responseStatus >= 400)
    .map(r => ({ url: r.name, status: r.responseStatus }))
`)
```

---

## КРИТЕРИИ ДЛЯ COMMIT

**НЕ ДЕЛАЙ COMMIT ПОКА:**
- [ ] npm run dev запускается БЕЗ ошибок
- [ ] curl возвращает HTML (не пустоту)
- [ ] Chrome DevTools показывает страницу
- [ ] document.title не пустой
- [ ] Нет ошибок в консоли
- [ ] API /api/admin/sources возвращает данные

**ТОЛЬКО ПОСЛЕ ВСЕХ ТЕСТОВ:**
```bash
git add .
git commit -m "fix: middleware eval error + missing react-dom

- Remove all auth imports from middleware
- Install react-dom dependency
- Clear .next build cache
- Tested locally: npm run dev works
- Tested browser: page loads without errors"

git push origin main
```

---

## ❌ НЕ ПОВТОРЯЙ ОШИБКИ!

**Cursor, ты делал так (ПЛОХО):**
1. Написал код
2. Сразу commit
3. Сразу push
4. **НЕ ПРОТЕСТИРОВАЛ!**

**Делай так (ПРАВИЛЬНО):**
1. Напиши код
2. npm run dev
3. Проверь логи
4. Открой в браузере
5. Используй Chrome DevTools MCP
6. Проверь что всё работает
7. **ТОЛЬКО ПОТОМ commit!**

---

## ВЫВОД ДЛЯ ОТЧЁТА

После тестирования выведи:

```
✅ ТЕСТИРОВАНИЕ ЗАВЕРШЕНО:

1. npm run dev:
   - Запустился: ДА/НЕТ
   - Ошибки: НЕТ / [список ошибок]
   - Ready в X секунд

2. curl test:
   - Вернул HTML: ДА/НЕТ
   - Размер ответа: XXX байт

3. Chrome DevTools:
   - Страница загрузилась: ДА/НЕТ
   - Title: "XXX"
   - Есть nav: ДА/НЕТ
   - Console errors: НЕТ / [список]

4. API test:
   - GET /api/admin/sources: 200 / XXX
   - Вернул данные: ДА/НЕТ

ГОТОВ К COMMIT: ДА/НЕТ
```

**НАЧИНАЙ! И НЕ КОММИТЬ БЕЗ ТЕСТОВ!**
