# CURSOR: FIX - admin layout не компилируется

## ❌ ПРОБЛЕМА
`app/admin/layout.tsx` не компилируется → `/admin/sources` возвращает 404

**Причина:** Server Action `handleLogout` в layout ломает Next.js 15 build.

## ✅ РЕШЕНИЕ
Упростить layout - убрать Server Action, использовать client-side logout.

---

## ИСПРАВЛЕНИЕ

### Шаг 1: Упростить app/admin/layout.tsx

Открой `app/admin/layout.tsx` и замени ВСЁ на:

```typescript
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/admin-login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/admin/sources" className="text-xl font-bold">
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

### Шаг 2: Обновить logout API

Открой `app/api/admin/auth/logout/route.ts` и замени на:

```typescript
import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth/session';

export async function GET() {
  await clearSessionCookie();
  return NextResponse.redirect(new URL('/admin-login', process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'));
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

## Шаг 3: Тест локально

```bash
npm run dev
```

Тесты:
1. Открой http://localhost:3000/admin-login
2. Залогинься (boss / 149521MkSF#u*V)
3. Должен открыться http://localhost:3000/admin/sources
4. Кнопка "Выйти" должна работать

---

## Шаг 4: Commit и Push

```bash
git add app/admin/layout.tsx app/api/admin/auth/logout/route.ts
git commit -m "fix: simplify admin layout (remove server action for logout)"
git push origin main
```

---

## Шаг 5: Подождать деплой (2-3 мин)

---

## Шаг 6: Проверка production

1. https://mediasyndicate.online/admin-login
2. Логин: boss / 149521MkSF#u*V  
3. Должен открыться /admin/sources
4. Logout должен работать

---

## ✅ КРИТЕРИИ ПРИЕМКИ

- [ ] Layout упрощён (без Server Action)
- [ ] Logout через GET endpoint
- [ ] npm run dev работает
- [ ] /admin/sources открывается локально
- [ ] Logout работает локально
- [ ] Git push успешен
- [ ] Build проходит на production
- [ ] /admin/sources открывается на production
- [ ] Logout работает на production

**НЕ ОСТАНАВЛИВАЙСЯ пока всё не работает!**
