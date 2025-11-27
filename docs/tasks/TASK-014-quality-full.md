# TASK-014: Comprehensive Quality Check

## ЦЕЛЬ
Полная проверка качества кода по всем параметрам

## ДЛЯ CURSOR

### 1. Установи инструменты
npm install -D jscpd madge cloc eslint-plugin-complexity

### 2. TypeScript проверка
npx tsc --noEmit > reports/typescript.txt 2>&1

### 3. ESLint проверка
npm run lint > reports/eslint.txt 2>&1

### 4. Circular Dependencies
npx madge --circular --extensions ts,tsx src app lib > reports/circular.txt 2>&1
npx madge --image reports/dependency-graph.svg src app lib

### 5. Code Duplication
npx jscpd src app lib --format markdown > reports/duplication.md 2>&1

### 6. Complexity Metrics
npx eslint src app lib --ext .ts,.tsx --format json --output-file reports/complexity.json

### 7. Security Audit
npm audit --production --json > reports/security.json 2>&1

### 8. Build Analysis
npm run build > reports/build.txt 2>&1

### 9. File Statistics
echo "=== Lines of Code ===" > reports/stats.txt
find src app lib -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -n >> reports/stats.txt
echo "" >> reports/stats.txt
echo "=== File Count ===" >> reports/stats.txt
find src app lib -name "*.ts" -o -name "*.tsx" | wc -l >> reports/stats.txt
echo "" >> reports/stats.txt
echo "=== Largest Files ===" >> reports/stats.txt
find src app lib -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -rn | head -20 >> reports/stats.txt

### 10. Dependency Analysis
npm list --depth=0 --json > reports/dependencies.json 2>&1

### 11. Создай сводный отчет
echo "# MediaSyndicate Code Quality Report" > reports/SUMMARY.md
echo "" >> reports/SUMMARY.md
echo "Date: $(date)" >> reports/SUMMARY.md
echo "" >> reports/SUMMARY.md
echo "## TypeScript" >> reports/SUMMARY.md
cat reports/typescript.txt | tail -5 >> reports/SUMMARY.md
echo "" >> reports/SUMMARY.md
echo "## ESLint" >> reports/SUMMARY.md
cat reports/eslint.txt | tail -10 >> reports/SUMMARY.md
echo "" >> reports/SUMMARY.md
echo "## Statistics" >> reports/SUMMARY.md
cat reports/stats.txt >> reports/SUMMARY.md
echo "" >> reports/SUMMARY.md
echo "## Security" >> reports/SUMMARY.md
cat reports/security.json | grep -A5 "vulnerabilities" >> reports/SUMMARY.md
echo "" >> reports/SUMMARY.md
echo "## Build Size" >> reports/SUMMARY.md
cat reports/build.txt | grep "First Load JS" >> reports/SUMMARY.md

### 12. Git add
mkdir -p reports
git add reports/

## КРИТЕРИИ
- Все инструменты установлены
- Все отчеты созданы в reports/
- SUMMARY.md содержит основные метрики
- Dependency graph создан
