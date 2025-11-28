# CURSOR: ДОБАВИТЬ ЛОГИРОВАНИЕ В SourceTable - ПРОСТАЯ ЗАДАЧА

## ПРОБЛЕМА
"Loading..." не исчезает. Нужно понять почему useQuery не завершается.

## ЗАДАЧА (ПРОСТАЯ!)

### Шаг 1: Добавь console.log в SourceTable.tsx

В `app/adminko/sources/components/SourceTable.tsx` строка ~30-47:

```typescript
const { data, isLoading, error, isError } = useQuery({
  queryKey: ['sources'],
  queryFn: async () => {
    console.log('🔍 FETCH STARTING'); // ДОБАВИТЬ
    
    const res = await fetch('/api/admin/sources', {
      credentials: 'include'
    });
    
    console.log('📡 FETCH RESPONSE:', res.status, res.ok); // ДОБАВИТЬ
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Failed to fetch sources' }));
      console.error('❌ FETCH ERROR:', errorData); // ДОБАВИТЬ
      throw new Error(errorData.error || `HTTP ${res.status}: Failed to fetch sources`);
    }
    
    const jsonData = await res.json();
    console.log('✅ FETCH SUCCESS:', jsonData); // ДОБАВИТЬ
    return jsonData;
  },
  retry: 1,
  retryDelay: 1000,
  onSuccess: (data) => { // ДОБАВИТЬ
    console.log('🎉 QUERY SUCCESS:', data);
  },
  onError: (err) => { // ДОБАВИТЬ
    console.error('💥 QUERY ERROR:', err);
  }
});

// ДОБАВИТЬ после useQuery
console.log('📊 QUERY STATE:', { isLoading, isError, hasData: !!data });
```

### Шаг 2: Commit и push

```bash
git add app/adminko/sources/components/SourceTable.tsx
git commit -m "debug: add logging to SourceTable useQuery"
git push origin main
```

### Шаг 3: Подожди деплой

```bash
sleep 120
```

### Шаг 4: Открой production в браузере

1. Открой: https://mediasyndicate.online/adminko/sources
2. Открой Console (F12)
3. Скопируй ВСЕ логи

### Шаг 5: Отчёт

```
🔍 ЛОГИ СОБРАНЫ

Console output:
[вставь сюда ВСЕ console.log из браузера]

Анализ:
- Запускается ли fetch? [да/нет]
- Какой статус ответа? [200/401/500/etc]
- Возвращаются ли данные? [да/нет]
- Какое состояние query? [isLoading/isError/success]

ГОТОВО ДЛЯ АНАЛИЗА
```

---

## ЭТО ВСЁ!

Не исправляй ничего - просто добавь логи и дай мне их.
Я сам пойму что не так и дам следующую задачу.

НАЧИНАЙ!
