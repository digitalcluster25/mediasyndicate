# TASK-009: Clean Install

## ПРОБЛЕМА
В package-lock.json смешаны старые и новые версии

## ДЛЯ CURSOR

1. Полная очистка:
rm -rf node_modules package-lock.json
npm cache clean --force

2. Свежая установка:
npm install

3. Тест:
npm run build

4. Коммит:
git add package-lock.json
git commit -m "fix: clean install package-lock"
git push

## КРИТЕРИИ
- В package-lock.json только одна версия picomatch
- Build OK
- Push OK
