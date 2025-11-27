# MediaSyndicate - Roadmap

**Обновлено:** 2024-11-26
**Статус:** Phase 1 в процессе

---

## PHASE 1: MVP (4 недели)

### ✅ Завершено

- [x] Настройка проекта (Next.js 15, React 19, TypeScript)
- [x] База данных (PostgreSQL на VPS)
- [x] Prisma ORM (Source, Article модели)
- [x] RSS парсер (lib/services/RSSParser.ts)
- [x] Import Service (lib/services/ImportService.ts)
- [x] Health API endpoint
- [x] Главная страница со списком статей
- [x] Docker setup
- [x] Dokploy integration
- [x] BBC Ukraine источник
- [x] Deploy на production (26.11.2024)

- [x] Code Quality Check (26.11.2024) - Grade A+
### ⏳ Осталось сделать

- [ ] Seed с 3+ источниками (Kyiv Post, Interfax, Ukrainska Pravda)
- [ ] Автоматический импорт каждые 30 мин
- [ ] AI фильтрация (Groq API)
  - Проверка релевантности Украине
  - Языковой фильтр
- [ ] Базовая дедупликация
- [ ] Категории статей
- [ ] SEO: meta tags, sitemap

---

## PHASE 2: Поиск + Ленты (3 недели)

### ⏳ TODO

- [ ] Elasticsearch setup
- [ ] Поиск по статьям
- [ ] Фильтры (дата, категория, источник)
- [ ] Персональные ленты
- [ ] RSS выход

---

## PHASE 3: Telegram Bot (2 недели)

### ⏳ TODO

- [ ] Telegram bot (VPS only!)
- [ ] Подписки на категории
- [ ] Уведомления о новостях
- [ ] Команды управления

---

## PHASE 4: Polish + Admin (3 недели)

### ⏳ TODO

- [ ] Admin панель
- [ ] Управление источниками
- [ ] Мониторинг системы
- [ ] Аналитика
- [ ] UI/UX полировка

---

## МЕТРИКИ

**Текущий прогресс Phase 1:** 75%

**Статистика:**
- Источников: 1 (BBC Ukraine)
- Статей в базе: ~50
- API endpoints: 2 (health, import)
- Deploy: ✅ SUCCESS
- Code Quality: Grade A+ (0 errors, 0 vulnerabilities)
- Total LOC: 270 lines in 8 files

---

## NEXT STEPS

1. Seed с дополнительными источниками
2. Настроить cron импорт (30 мин)
3. AI фильтрация через Groq
4. Тестирование на production
5. SEO optimization
