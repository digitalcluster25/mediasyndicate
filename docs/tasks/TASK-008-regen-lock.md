# TASK-008: Regenerate package-lock

## ПРОБЛЕМА
package-lock устарел после обновления Next.js

## ДЛЯ CURSOR

1. Удали lock:
rm package-lock.json

2. Регенерируй:
npm install

3. Проверь:
npm run build

4. Закоммить:
git add package-lock.json
git commit -m "fix: regenerate lock after Next.js 15.5.6"
git push

## КРИТЕРИИ
- npm run build OK
- git push OK
- package-lock.json в репозитории
