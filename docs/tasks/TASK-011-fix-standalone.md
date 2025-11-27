# TASK-011: Fix Standalone Mode

## ПРОБЛЕМА
next.config.mjs использует output: standalone
Но npm start запускает next start
Несовместимо!

## РЕШЕНИЕ - УБРАТЬ STANDALONE

## ДЛЯ CURSOR

Открой next.config.mjs и удали строку:
output: standalone

Должно быть:
const nextConfig = {};

export default nextConfig;

## ТЕСТИРОВАНИЕ
npm run build
npm start
curl http://localhost:3000/api/health

## КОММИТ
git add next.config.mjs
git commit -m "fix: remove standalone for compatibility"
git push

## КРИТЕРИИ
- Build OK
- Start OK
- Health API отвечает
