# TASK-003: Deploy Preparation

## ЧАСТЬ 1: Подготовка к деплою

### Задачи:
1. Создать Dockerfile для production
2. Создать .dockerignore
3. Создать docker-compose.yml для локального тестирования
4. Создать .env.example с примерами переменных окружения
5. Добавить postinstall скрипт в package.json для генерации Prisma client
6. Обновить next.config.mjs для production оптимизаций

### Критерии успеха:
- ✅ Dockerfile собирает образ без ошибок
- ✅ docker-compose up запускает приложение
- ✅ .env.example содержит все необходимые переменные
- ✅ postinstall генерирует Prisma client автоматически

## ЧАСТЬ 2: CI/CD (будущая задача)
- Настройка GitHub Actions
- Автоматический деплой

