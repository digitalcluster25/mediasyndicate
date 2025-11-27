# TASK-010: Force Rebuild Lock

## ПРОБЛЕМА
Cursor не обновил package-lock правильно
Все еще picomatch@2.3.1 вместо 4.x

## ДЛЯ CURSOR

1. Удали:
rm -rf node_modules package-lock.json ~/.npm

2. Установи заново:
npm install

3. ПРОВЕРЬ результат:
grep -A2 "node_modules/picomatch" package-lock.json | grep version
Должно быть: "version": "4.

Если версия НЕ 4.x - повтори шаги 1-3!

4. Build:
npm run build

5. Коммит:
git add package-lock.json
git commit -m "fix: force update to picomatch 4.x"
git push

## КРИТЕРИИ
- picomatch version 4.x в lock
- Build OK
- Push OK
- НЕ ОСТАНАВЛИВАЙСЯ пока версия не 4.x!
