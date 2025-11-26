# TASK-002: Fix RSS Import

## ПРОБЛЕМА
- npx prisma db seed не работает (нет конфигурации в package.json)
- curl POST /api/import возвращает imported: 0
- Статьи не появляются на сайте

## ЦЕЛЬ
Сделать так чтобы импорт работал и статьи появлялись на главной странице.

## ЧТО НУЖНО ИСПРАВИТЬ

1. **Настрой seed в package.json**
   - Добавь секцию prisma.seed
   - Команда должна запускать tsx prisma/seed.ts

2. **Убедись что prisma/seed.ts создает источник**
   - Должен создать хотя бы один Source с type=RSS, isActive=true
   - Рекомендую BBC Ukraine: https://feeds.bbci.co.uk/news/world/europe/rss.xml
   - Добавь console.log чтобы видеть что создалось

3. **Добавь логирование в RSSParser и ImportService**
   - В RSSParser.parse(): лог перед парсингом, лог сколько items получено
   - В ImportService.importFromSource(): лог source.name, лог сколько items из RSS, лог сколько imported
   - В ImportService.importAll(): лог сколько sources найдено, лог total imported
   
4. **Проверь что rss-parser используется правильно**
   - Должен возвращать массив с title, link, content/contentSnippet, pubDate
   - Убедись что ни один item не теряется

## КАК ТЕСТИРОВАТЬ

1. Запусти seed:
   ```bash
   npx prisma db seed
   ```
   Должен вывести что-то вроде: Created source: BBC Ukraine

2. Убедись что dev server запущен:
   ```bash
   npm run dev
   ```

3. В ДРУГОМ терминале запусти импорт:
   ```bash
   curl -X POST http://localhost:3000/api/import
   ```

4. СМОТРИ ЛОГИ в терминале где npm run dev
   - Должно быть: Parsing RSS, Feed parsed X items, Imported Y articles
   
5. Открой http://localhost:3000
   - Должны быть статьи

## КРИТЕРИИ УСПЕХА

- ✅ npx prisma db seed выполняется без ошибок и создает source
- ✅ curl POST /api/import возвращает {success: true, imported: >0}
- ✅ В логах npm run dev видны console.log из сервисов
- ✅ На главной странице http://localhost:3000 отображаются статьи
- ✅ В логах видно: сколько RSS items спарсилось, сколько сохранилось в БД

## DEBUGGING

Если imported всё еще 0:
1. Смотри логи - сколько items возвращает parser.parse()?
2. Если items = 0 - проблема с парсингом RSS (неправильный URL? блокировка?)
3. Если items > 0 но imported = 0 - проблема с сохранением (ошибки в upsert? неправильный sourceId?)
4. Добавляй больше логов чтобы понять где теряются данные

## ВАЖНО

НЕ ОСТАНАВЛИВАЙСЯ пока:
- Статьи не появятся на http://localhost:3000
- curl POST /api/import не вернет imported > 0

Тестируй после каждого изменения!
