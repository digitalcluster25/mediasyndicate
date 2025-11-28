# CURSOR: FIX - API запросы не передают cookies

## ПРОБЛЕМА
Fetch запросы в SourceTable и SourceForm не передают cookies.
Результат: 401 Unauthorized на всех API запросах.

## РЕШЕНИЕ
Добавить `credentials: 'include'` во все fetch.

---

## ШАГ 1: Исправить app/adminko/sources/components/SourceTable.tsx

Найди ВСЕ fetch и добавь `credentials: 'include'`:

```typescript
// Fetch sources
const { data, isLoading } = useQuery({
  queryKey: ['sources'],
  queryFn: async () => {
    const res = await fetch('/api/admin/sources', {
      credentials: 'include' // ← ДОБАВИТЬ
    });
    if (!res.ok) throw new Error('Failed to fetch sources');
    return res.json();
  }
});

// Manual import
mutationFn: async (sourceId: string) => {
  setImportingId(sourceId);
  const res = await fetch(`/api/admin/sources/${sourceId}/import`, {
    method: 'POST',
    credentials: 'include' // ← ДОБАВИТЬ
  });
  if (!res.ok) throw new Error('Import failed');
  return res.json();
}

// Delete mutation
mutationFn: async (sourceId: string) => {
  const res = await fetch(`/api/admin/sources/${sourceId}`, {
    method: 'DELETE',
    credentials: 'include' // ← ДОБАВИТЬ
  });
  if (!res.ok) throw new Error('Delete failed');
  return res.json();
}

// Toggle active
mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
  const res = await fetch(`/api/admin/sources/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // ← ДОБАВИТЬ
    body: JSON.stringify({ isActive })
  });
  if (!res.ok) throw new Error('Update failed');
  return res.json();
}
```

---

## ШАГ 2: Исправить app/adminko/sources/components/SourceForm.tsx

Найди ВСЕ fetch и добавь `credentials: 'include'`:

```typescript
// Test RSS
const testRes = await fetch('/api/admin/sources/test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // ← ДОБАВИТЬ
  body: JSON.stringify({ url: data.url })
});

// Create source
mutationFn: async (data: SourceFormData) => {
  const res = await fetch('/api/admin/sources', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // ← ДОБАВИТЬ
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create source');
  return res.json();
}

// Update source
mutationFn: async (data: SourceFormData) => {
  const res = await fetch(`/api/admin/sources/${editingSource.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // ← ДОБАВИТЬ
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update source');
  return res.json();
}
```

---

## ШАГ 3: Проверить app/adminko/page.tsx (логин)

Убедись что там тоже есть `credentials: 'include'`:

```typescript
const res = await fetch('/api/admin/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // ← Должно быть
  body: JSON.stringify({ username, password })
});
```

---

## ТЕСТ ЛОКАЛЬНО

```bash
npm run dev
```

1. Открой http://localhost:3000/adminko
2. Залогинься
3. DevTools → Network
4. Должны работать:
   - GET /api/admin/sources → 200 (не 401!)
   - POST /api/admin/sources → 200
   - DELETE /api/admin/sources/[id] → 200

---

## COMMIT

```bash
git add app/adminko/sources/components/
git add app/adminko/page.tsx
git commit -m "fix: add credentials include to all API fetch calls

- SourceTable.tsx: all fetch now include credentials
- SourceForm.tsx: all fetch now include credentials  
- Fixes 401 errors on API requests
- Cookies now properly sent with requests"

git push origin main
```

---

## КРИТЕРИИ

- [ ] Все fetch имеют credentials: 'include'
- [ ] npm run dev работает
- [ ] Логин работает
- [ ] API /api/admin/sources возвращает 200 (не 401)
- [ ] Можно создать источник
- [ ] Git push успешен

НЕ ОСТАНАВЛИВАЙСЯ пока API не вернёт 200!
