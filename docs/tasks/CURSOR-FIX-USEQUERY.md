# CURSOR: ИСПРАВИТЬ useQuery - ГОТОВОЕ РЕШЕНИЕ

## ПРОБЛЕМА
API работает, но useQuery не загружает данные. Loading не исчезает.

## РЕШЕНИЕ (КОПИРУЙ И ВСТАВЛЯЙ)

### Файл: app/adminko/sources/components/SourceTable.tsx

**Замени весь useQuery (строки ~29-48) на это:**

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['sources'],
  queryFn: async () => {
    const res = await fetch('/api/admin/sources', {
      credentials: 'include',
      cache: 'no-store'  // ДОБАВИТЬ
    });
    if (!res.ok) {
      throw new Error('Failed to fetch sources');
    }
    const json = await res.json();
    return json;
  },
  staleTime: 0,  // ДОБАВИТЬ
  refetchOnMount: true  // ДОБАВИТЬ
});
```

**И замени условие Loading (строка ~97):**

БЫЛО:
```typescript
if (isLoading) return <div>Loading...</div>;
```

СТАЛО:
```typescript
if (isLoading) {
  return (
    <div className="rounded-md border p-4 text-center">
      <p className="text-gray-600">Загрузка источников...</p>
    </div>
  );
}
```

**И добавь проверку после isError (строка ~116):**

ПОСЛЕ:
```typescript
if (isError) {
  return (...);
}
```

ДОБАВИТЬ:
```typescript
if (!data?.sources) {
  return (
    <div className="rounded-md border p-4 text-center text-gray-500">
      Нет данных. Попробуйте обновить страницу.
    </div>
  );
}
```

---

## COMMIT

```bash
git add app/adminko/sources/components/SourceTable.tsx
git commit -m "fix: useQuery not loading data - add cache control"
git push origin main
```

---

## ПОДОЖДИ ДЕПЛОЙ

```bash
sleep 120
```

---

## ПРОВЕРЬ

Открой https://mediasyndicate.online/adminko/sources

**ДОЛЖНО БЫТЬ:**
- ✅ Таблица с источниками
- ❌ НЕТ "Loading..."

**ЕСЛИ ВСЁЕЩЁ Loading:**
- Открой консоль (F12)
- Скриншот ошибок
- Отчёт

---

## НАЧИНАЙ!
