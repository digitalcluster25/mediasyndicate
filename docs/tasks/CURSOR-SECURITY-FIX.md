# CURSOR: КРИТИЧЕСКИЙ FIX - Креды в Git + 404 после логина

## 🚨 ПРОБЛЕМА 1: КРЕДЫ В GIT
Файл `lib/auth/credentials.ts` с паролем запушен в публичный репозиторий!

## 🚨 ПРОБЛЕМА 2: 404 после логина
После успешной авторизации `/admin/sources` возвращает 404.

---

## ИСПРАВЛЕНИЕ

### Шаг 1: Удалить креды из Git и переместить в .env

```bash
# Удалить из Git истории
git rm --cached lib/auth/credentials.ts
git commit -m "security: remove hardcoded credentials from git"

# Добавить в .gitignore
echo "lib/auth/credentials.ts" >> .gitignore
git add .gitignore
git commit -m "chore: add credentials.ts to gitignore"
```

### Шаг 2: Создать .env.example

Создай файл `.env.example`:
```env
# Admin credentials
ADMIN_USERNAME=boss
ADMIN_PASSWORD=your_secure_password_here

# JWT secret for sessions
JWT_SECRET=your_jwt_secret_here
```

### Шаг 3: Обновить credentials.ts

Открой `lib/auth/credentials.ts` и замени на:

```typescript
export const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME || 'boss',
  password: process.env.ADMIN_PASSWORD || 'fallback_password'
};

if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
  console.warn('⚠️ ADMIN_USERNAME or ADMIN_PASSWORD not set in environment!');
}
```

### Шаг 4: Добавить переменные в Dokploy

**ВАЖНО:** Добавь в Dokploy Environment:
```
ADMIN_USERNAME=boss
ADMIN_PASSWORD=149521MkSF#u*V
JWT_SECRET=mediasyndicate-secret-key-2024-production
```

### Шаг 5: Проверка app/providers.tsx

Открой `app/providers.tsx` - убедись что он существует и правильный:

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### Шаг 6: Проверка app/layout.tsx

Открой `app/layout.tsx` - убедись что Providers и Toaster подключены:

```typescript
import { Providers } from './providers';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
```

### Шаг 7: Добавить dynamic export в sources page

Открой `app/admin/sources/page.tsx` и добавь в начало:

```typescript
'use client';

export const dynamic = 'force-dynamic';

// ... остальной код
```

### Шаг 8: Проверить компоненты существуют

```bash
# Проверь что эти файлы существуют
ls -la app/admin/sources/components/SourceTable.tsx
ls -la app/admin/sources/components/SourceForm.tsx
```

Если НЕТ - создай заглушки:

**app/admin/sources/components/SourceTable.tsx:**
```typescript
'use client';

export function SourceTable() {
  return (
    <div className="p-4 border rounded">
      <p>SourceTable component - coming soon</p>
    </div>
  );
}
```

**app/admin/sources/components/SourceForm.tsx:**
```typescript
'use client';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SourceForm({ open, onOpenChange }: Props) {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-6 rounded">
        <h2>SourceForm - coming soon</h2>
        <button onClick={() => onOpenChange(false)}>Close</button>
      </div>
    </div>
  );
}
```

---

## Шаг 9: Тест локально

```bash
# Создать .env.local с credentials
cat > .env.local << 'EOF'
ADMIN_USERNAME=boss
ADMIN_PASSWORD=149521MkSF#u*V
JWT_SECRET=mediasyndicate-secret-key-2024
EOF

npm run dev
```

Открой: http://localhost:3000/admin-login
Залогинься → должен открыться /admin/sources

---

## Шаг 10: Commit

```bash
git add .
git commit -m "security: move credentials to env vars + fix admin sources page

- Remove hardcoded credentials from git
- Use environment variables for auth
- Add .env.example
- Fix providers and layout setup
- Add dynamic export to sources page"

git push origin main
```

---

## Шаг 11: Настроить Dokploy

**В Dokploy UI:**
1. Открой project media-syndicate
2. Settings → Environment Variables
3. Добавь:
   - `ADMIN_USERNAME=boss`
   - `ADMIN_PASSWORD=149521MkSF#u*V`
   - `JWT_SECRET=mediasyndicate-secret-key-2024-production`
4. Save
5. Redeploy

---

## Шаг 12: Подождать деплой (2-3 мин)

---

## Шаг 13: Проверка production

1. https://mediasyndicate.online/admin-login
2. Логин: boss / 149521MkSF#u*V
3. Должен открыться /admin/sources

---

## ✅ КРИТЕРИИ ПРИЕМКИ

- [ ] lib/auth/credentials.ts удалён из Git
- [ ] .env.example создан
- [ ] credentials.ts использует process.env
- [ ] .gitignore обновлён
- [ ] Dokploy environment настроен
- [ ] npm run dev работает локально
- [ ] Логин работает локально
- [ ] /admin/sources открывается локально
- [ ] Git push успешен
- [ ] Production работает
- [ ] Логин работает на production
- [ ] /admin/sources открывается на production

**НЕ ОСТАНАВЛИВАЙСЯ пока все ✅!**
