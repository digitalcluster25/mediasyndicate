// Интервалы polling по периодам (в мс)
export const POLL_INTERVALS = {
  online: 30_000,   // 30 сек
  hour: 120_000,    // 2 мин
  day: 300_000      // 5 мин
} as const;

// Порог для "горячей" новости
export const HOT_THRESHOLD = 5; // позиций за обновление

// Время для определения "новой" статьи по периодам (в минутах)
export const NEW_THRESHOLDS = {
  online: 10,
  hour: 60,
  day: 1440
} as const;

