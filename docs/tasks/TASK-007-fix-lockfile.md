# TASK-007: Fix package-lock.json

## ПРОБЛЕМА
package-lock.json не синхронизирован

## ДЛЯ CURSOR

rm -rf node_modules package-lock.json
npm install
npm run build
git add package-lock.json
git commit -m "fix: regenerate package-lock"
git push

## КРИТЕРИИ
- Build OK
- Push OK
