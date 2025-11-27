# TASK-016: Rollback SonarQube

## ЦЕЛЬ
Удалить все файлы и настройки SonarQube

## ДЛЯ CURSOR

### 1. Останови Docker контейнер (если запущен)
docker-compose -f docker-compose.sonar.yml down -v

### 2. Удали файлы
rm -f docker-compose.sonar.yml
rm -f sonar-project.properties
rm -f reports/SONARQUBE.md

### 3. Удали пакет
npm uninstall sonarqube-scanner

### 4. Удали scripts из package.json
Удали эти строки:
  "sonar:start"
  "sonar:stop"
  "sonar:scan"
  "quality:sonar"

### 5. Удали Docker volumes (если есть)
docker volume rm mediasyndicate_sonarqube_data 2>/dev/null || true
docker volume rm mediasyndicate_sonarqube_logs 2>/dev/null || true
docker volume rm mediasyndicate_sonarqube_extensions 2>/dev/null || true

## КРИТЕРИИ
- docker-compose.sonar.yml удален
- sonar-project.properties удален
- sonarqube-scanner удален
- Scripts удалены из package.json
- Контейнер остановлен
- Volumes удалены
