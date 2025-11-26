# TASK-005: Fix React/Next.js Versions

## ПРОБЛЕМА
Deploy failed: Next.js 15.0.0 не поддерживает React 19.0.0

## ДЛЯ CURSOR

Открой package.json и измени:

```json
"next": "^15.5.6"
```

Было: "next": "^15.0.0"

## КОМАНДЫ

1. Удали:
```bash
rm -rf node_modules package-lock.json
```

2. Установи:
```bash
npm install
```

3. Тест:
```bash
npm run build
```

## КРИТЕРИИ

- npm install без ошибок
- npm run build успешен
