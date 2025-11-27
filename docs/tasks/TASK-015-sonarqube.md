# TASK-015: SonarQube Full Analysis

## ЦЕЛЬ
Установить SonarQube и провести глубокий анализ кода

## ДЛЯ CURSOR

### 1. Создай docker-compose для SonarQube
Создай файл: docker-compose.sonar.yml

version: "3"
services:
  sonarqube:
    image: sonarqube:community
    ports:
      - "9000:9000"
    environment:
      - SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true
    volumes:
      - sonarqube_data:/opt/sonarqube/data
      - sonarqube_logs:/opt/sonarqube/logs
      - sonarqube_extensions:/opt/sonarqube/extensions

volumes:
  sonarqube_data:
  sonarqube_logs:
  sonarqube_extensions:

### 2. Создай sonar-project.properties

sonar.projectKey=mediasyndicate
sonar.projectName=MediaSyndicate
sonar.projectVersion=1.0
sonar.sources=src,app,lib
sonar.tests=__tests__
sonar.sourceEncoding=UTF-8
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.typescript.tsconfigPath=tsconfig.json
sonar.exclusions=**/*.test.ts,**/*.test.tsx,**/node_modules/**,**/.next/**

### 3. Установи sonar-scanner
npm install -D sonarqube-scanner

### 4. Добавь scripts в package.json

"scripts": {
  "sonar:start": "docker-compose -f docker-compose.sonar.yml up -d",
  "sonar:stop": "docker-compose -f docker-compose.sonar.yml down",
  "sonar:scan": "sonar-scanner",
  "quality:sonar": "npm run sonar:start && sleep 30 && npm run sonar:scan"
}

### 5. Запусти анализ

# Старт SonarQube
docker-compose -f docker-compose.sonar.yml up -d

# Жди 30 сек пока SonarQube запустится
sleep 30

# Открой браузер и настрой токен
echo "Открой http://localhost:9000"
echo "Login: admin / Password: admin"
echo "Смени пароль и создай токен в My Account -> Security"
echo "Сохрани токен в .env.local: SONAR_TOKEN=your_token"

# После получения токена запусти:
npx sonar-scanner -Dsonar.login=$SONAR_TOKEN

### 6. Создай отчет

echo "# SonarQube Analysis Report" > reports/SONARQUBE.md
echo "" >> reports/SONARQUBE.md
echo "Dashboard: http://localhost:9000/dashboard?id=mediasyndicate" >> reports/SONARQUBE.md
echo "" >> reports/SONARQUBE.md
echo "## Metrics" >> reports/SONARQUBE.md
echo "- Maintainability Rating: Check dashboard" >> reports/SONARQUBE.md
echo "- Reliability Rating: Check dashboard" >> reports/SONARQUBE.md
echo "- Security Rating: Check dashboard" >> reports/SONARQUBE.md
echo "- Technical Debt: Check dashboard" >> reports/SONARQUBE.md
echo "- Code Smells: Check dashboard" >> reports/SONARQUBE.md
echo "- Bugs: Check dashboard" >> reports/SONARQUBE.md
echo "- Vulnerabilities: Check dashboard" >> reports/SONARQUBE.md
echo "- Duplications: Check dashboard" >> reports/SONARQUBE.md

## ВАЖНО

SonarQube запускается на http://localhost:9000
Первый запуск занимает 30-60 секунд
Нужно вручную создать токен в UI
После анализа смотри результаты в веб-интерфейсе

## КРИТЕРИИ
- docker-compose.sonar.yml создан
- sonar-project.properties создан
- SonarQube запущен (localhost:9000)
- Токен создан
- Анализ выполнен
- Отчет SONARQUBE.md создан

НЕ ОСТАНАВЛИВАЙСЯ пока не увидишь результаты!
