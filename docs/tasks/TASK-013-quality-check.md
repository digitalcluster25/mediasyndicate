# TASK-013: Code Quality Check

## ЦЕЛЬ
Установить инструменты и проверить качество кода

## ДЛЯ CURSOR

1. Установи инструменты:
npm install -D jscpd madge cloc

2. Создай package.json scripts:
"scripts": {
  "quality:types": "tsc --noEmit",
  "quality:lint": "next lint",
  "quality:circular": "madge --circular --extensions ts,tsx src app lib",
  "quality:duplicate": "jscpd src app lib",
  "quality:audit": "npm audit --production",
  "quality:all": "npm run quality:types && npm run quality:lint && npm run quality:circular && npm run quality:duplicate"
}

3. Запусти проверку:
npm run quality:all

4. Сохрани результат:
npm run quality:all > quality-report.txt 2>&1

## КРИТЕРИИ
- Все инструменты установлены
- Scripts добавлены
- Отчет создан
