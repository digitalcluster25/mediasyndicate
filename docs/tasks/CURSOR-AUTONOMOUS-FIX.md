# CURSOR: СДЕЛАТЬ РАБОТАЮЩУЮ АДМИНКУ - АВТОНОМНО

## ТВОЯ ЗАДАЧА
Сделать чтобы https://mediasyndicate.online/adminko/sources РАБОТАЛА полностью.

## ЧТО ЭТО ЗНАЧИТ
Страница должна:
1. Загружаться без ошибок
2. Показывать список источников
3. Кнопки работают
4. API возвращает данные
5. Можно добавить источник
6. Можно удалить источник

## КАК РАБОТАТЬ

### РЕЖИМ: АВТОНОМНЫЙ ЦИКЛ

```
1. Открой https://mediasyndicate.online/adminko/sources
2. Используй Chrome DevTools MCP
3. Найди ВСЕ ошибки
4. Исправь
5. Commit и push
6. Подожди деплой (2 минуты)
7. Проверь снова
8. ЕСЛИ есть ошибки → вернись к шагу 3
9. ЕСЛИ всё работает → ОТЧЁТ
```

**НЕ ОСТАНАВЛИВАЙСЯ пока не работает!**

---

## ИНСТРУМЕНТЫ

### Chrome DevTools MCP:
```javascript
// Открыть страницу
open_url("https://mediasyndicate.online/adminko/sources")

// Проверить ошибки
execute_javascript(`
  window.allErrors = [];
  window.addEventListener('error', e => window.allErrors.push(e.message));
  performance.getEntriesByType('resource')
    .filter(r => r.responseStatus >= 400)
`)

// Проверить что загрузилось
execute_javascript(`
({
  loaded: document.readyState,
  title: document.title,
  hasTable: !!document.querySelector('table'),
  bodyText: document.body.innerText.substring(0, 300)
})
`)

// Проверить консоль
get_page_content()
```

### Git:
```bash
git add .
git commit -m "fix: [что исправил]"
git push origin main
```

### Ожидание деплоя:
```bash
sleep 120
```

---

## ЧАСТЫЕ ПРОБЛЕМЫ

### Проблема: "source.txt скачивается"
**Решение:** Content-Type неправильный, проверь middleware headers

### Проблема: 401 на API
**Решение:** Auth не отключена везде, проверь все routes

### Проблема: 502
**Решение:** Caddy не обновился, но это не твоя проблема - просто подожди 30 сек

### Проблема: Страница пустая
**Решение:** Проверь что React рендерится, проверь errors в console

---

## КРИТЕРИИ УСПЕХА

### ✅ РАБОТАЕТ если:
1. Страница открывается
2. Title = "MediaSyndicate"
3. Видна nav bar
4. Видна таблица с источниками
5. Есть кнопка "Добавить источник"
6. Console errors = 0
7. API /api/admin/sources возвращает JSON с источниками
8. Network requests = 200 (не 401, 500, 502)

### ❌ НЕ РАБОТАЕТ если:
- Скачивается файл
- 404, 500, 502 ошибки
- Пустая страница
- Console errors
- API не отвечает

---

## ОТЧЁТ (ТОЛЬКО КОГДА ВСЁ РАБОТАЕТ)

```
✅ АДМИНКА РАБОТАЕТ

Проверено:
1. URL: https://mediasyndicate.online/adminko/sources
2. HTTP: 200
3. Title: "MediaSyndicate"
4. Table: отображается
5. Sources: [количество]
6. Console: 0 errors
7. API: 200, вернул данные

Сделано:
- [Список коммитов]
- [Что исправлялось]
- [Сколько итераций]

ГОТОВО К ИСПОЛЬЗОВАНИЮ
```

---

## ВАЖНО!

1. **НЕ СПРАШИВАЙ разрешения** - просто делай
2. **ЦИКЛИСЬ** пока не работает
3. **ТЕСТИРУЙ на production** (не локально)
4. **ИСПОЛЬЗУЙ Chrome DevTools MCP** для проверок
5. **КОММИТЬ после каждого исправления**
6. **ОТЧЁТ только когда 100% работает**

---

## НАЧИНАЙ!

Открой https://mediasyndicate.online/adminko/sources и работай пока не заработает.

**Я ВЕРНУСЬ когда ты напишешь что ГОТОВО.**
