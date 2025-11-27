# CURSOR: FIX - admin layout редиректит /admin/login

## ❌ ПРОБЛЕМА
`app/admin/layout.tsx` применяется ко ВСЕМ страницам `/admin/*` включая `/admin/login`.
Layout проверяет сессию и редиректит → бесконечный цикл.

## ✅ РЕШЕНИЕ  
Переместить `/admin/login` ВНЕ admin layout.

---

## ИСПРАВЛЕНИЕ

### Шаг 1: Переместить страницу логина

```bash
# Создать новую структуру
mkdir -p app/admin-login

# Переместить login page
mv app/admin/login/page.tsx app/admin-login/page.tsx

# Удалить старую папку
rm -rf app/admin/login
```

### Шаг 2: Обновить middleware.ts

Открой `middleware.ts` и измени:

```typescript
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Пропустить /admin-login БЕЗ проверки
  if (path === '/admin-login' || path.startsWith('/admin-login/')) {
    return NextResponse.next();
  }
  
  // Для всех /admin/* - проверить сессию
  if (path.startsWith('/admin')) {
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
```

### Шаг 3: Обновить admin layout

Открой `app/admin/layout.tsx` и измени редирект:

```typescript
if (!session) {
  redirect('/admin-login'); // ← Изменено с /admin/login
}

// В logout тоже изменить:
const handleLogout = async () => {
  'use server';
  await fetch('/api/admin/auth/logout', { method: 'POST' });
  redirect('/admin-login'); // ← Изменено
};
```

### Шаг 4: Обновить API login

Открой `app/api/admin/auth/login/route.ts` - там всё ОК (redirect идёт в клиенте).

---

## Шаг 5: Тест локально

```bash
npm run dev
```

Открой: http://localhost:3000/admin-login
Должна открыться форма логина.

После логина: http://localhost:3000/admin/sources

---

## Шаг 6: Commit и Push

```bash
git add .
git commit -m "fix: move login outside admin layout to prevent redirect loop"
git push origin main
```

---

## Шаг 7: Подождать деплой (2 мин)

---

## Шаг 8: Проверка

**Тесты:**
- ✅ https://mediasyndicate.online/admin-login открывается
- ✅ Форма логина видна
- ✅ Логин работает (boss / 149521MkSF#u*V)
- ✅ После логина открывается /admin/sources
- ✅ Logout возвращает на /admin-login

---

## ✅ КРИТЕРИИ ПРИЕМКИ

- [ ] npm run dev работает
- [ ] /admin-login открывается БЕЗ редиректов
- [ ] /admin/sources редиректит на /admin-login (если не залогинен)
- [ ] Логин работает
- [ ] После логина открывается /admin/sources
- [ ] Logout работает
- [ ] Git push успешен
- [ ] Production работает

**НЕ ОСТАНАВЛИВАЙСЯ пока все ✅!**
