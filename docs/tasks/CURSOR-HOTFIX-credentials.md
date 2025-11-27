# CURSOR: ЭКСТРЕННЫЙ FIX - Вернуть credentials.ts

## ❌ ПРОБЛЕМА
Build failed: `Can't resolve '@/lib/auth/credentials'`

Cursor удалил файл из Git, но он нужен для импортов!

## ✅ РЕШЕНИЕ
Вернуть файл, но с использованием env vars.

---

## ИСПРАВЛЕНИЕ

### Шаг 1: Создать lib/auth/credentials.ts

```typescript
// Credentials читаются из environment variables
export const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME || 'boss',
  password: process.env.ADMIN_PASSWORD || ''
};

// Предупреждение если переменные не заданы
if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
  console.warn('⚠️  ADMIN_USERNAME or ADMIN_PASSWORD not set in environment variables!');
  console.warn('⚠️  Admin login will not work without these variables.');
}
```

### Шаг 2: Обновить .gitignore

Открой `.gitignore` и **УДАЛИ** строку `lib/auth/credentials.ts` (если она там есть).

Этот файл ДОЛЖЕН быть в Git, просто без hardcoded паролей.

### Шаг 3: Commit и Push

```bash
git add lib/auth/credentials.ts
git add .gitignore
git commit -m "fix: restore credentials.ts with env vars (required for build)"
git push origin main
```

---

## Шаг 4: Подождать деплой (2-3 мин)

Build должен пройти успешно.

---

## Шаг 5: После успешного build - добавить env vars в Dokploy

**ВАЖНО:** Сразу после успешного build, Andy должен добавить в Dokploy:

```
ADMIN_USERNAME=boss
ADMIN_PASSWORD=149521MkSF#u*V
JWT_SECRET=mediasyndicate-secret-key-2024-production
```

И сделать Redeploy.

---

## ✅ КРИТЕРИИ ПРИЕМКИ

- [ ] lib/auth/credentials.ts создан
- [ ] Файл использует process.env
- [ ] .gitignore НЕ содержит lib/auth/credentials.ts
- [ ] Git commit успешен
- [ ] Git push успешен
- [ ] Build проходит успешно
- [ ] Контейнер запускается

**НЕ ОСТАНАВЛИВАЙСЯ пока build не пройдёт!**

---

## ВАЖНО ДЛЯ ANDY

После успешного build нужно:
1. Dokploy UI → media-syndicate → Environment
2. Добавить 3 переменные (я дам значения)
3. Redeploy
