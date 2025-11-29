'use client';

import { useState, useEffect, useCallback } from 'react';

export interface RatingArticle {
  id: string;
  title: string;
  url: string;
  sourceName: string;
  rating: number;
  ratingDelta: number;
  position: number;
  positionChange: number;
  views: number;
  reactions: number;
  forwards: number;
  replies: number;
  isNew: boolean;
  isHot: boolean;
}

interface UseLiveRatingOptions {
  period?: 'online' | 'hour' | 'day';
  limit?: number;
  enabled?: boolean;
}

const POLL_INTERVALS = {
  online: 5_000,    // 5 сек - более частое обновление для динамичности
  hour: 10_000,     // 10 сек
  day: 15_000       // 15 сек
};

export function useLiveRating(options: UseLiveRatingOptions = {}) {
  const { period = 'hour', limit = 50, enabled = true } = options;
  
  const [articles, setArticles] = useState<RatingArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const [nextUpdate, setNextUpdate] = useState<number>(0);
  const [timeUntilNextUpdate, setTimeUntilNextUpdate] = useState<number>(0);

  const fetchRating = useCallback(async (retryCount = 0, silent = false) => {
    try {
      // Добавляем таймаут для запроса (30 секунд)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const res = await fetch(`/api/rating/live?period=${period}&limit=${limit}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }
      
      const data = await res.json();
      
      // Проверяем, есть ли ошибка в ответе
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Обновляем данные без показа loading индикатора
      setArticles(data.articles || []);
      setLastUpdate(data.lastUpdate || Date.now());
      setNextUpdate(data.nextUpdate || Date.now() + 30000);
      setTimeUntilNextUpdate(data.timeUntilNextUpdate || 30000);
      
      // Показываем ошибку только если нет данных
      if (data.articles && data.articles.length > 0) {
        setError(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // Если это ошибка сети и у нас есть данные, не показываем ошибку
      if (err instanceof Error && err.name === 'AbortError') {
        if (articles.length > 0) {
          // Есть кэшированные данные, просто обновим таймер
          setTimeUntilNextUpdate(30000);
          return;
        }
        // Показываем ошибку только если нет данных
        if (!silent) {
          setError('Request timeout. Retrying...');
        }
      } else {
        // Показываем ошибку только если нет данных и не silent режим
        if (!silent && articles.length === 0) {
          setError(errorMessage);
        }
      }
      
      // Retry логика: максимум 2 попытки с задержкой (silent режим)
      if (retryCount < 2) {
        setTimeout(() => {
          fetchRating(retryCount + 1, true); // Silent retry
        }, 2000 * (retryCount + 1)); // 2s, 4s
      }
    } finally {
      // Показываем loading только при первой загрузке
      if (!silent) {
        setLoading(false);
      }
    }
  }, [period, limit, articles.length]);

  // Polling для данных
  useEffect(() => {
    if (!enabled) return;
    
    fetchRating();
    const interval = setInterval(fetchRating, POLL_INTERVALS[period]);
    return () => clearInterval(interval);
  }, [fetchRating, period, enabled]);

  // Countdown таймер (обновляется каждую секунду)
  useEffect(() => {
    if (!enabled || nextUpdate === 0) return;
    
    const countdownInterval = setInterval(() => {
      const remaining = Math.max(0, nextUpdate - Date.now());
      setTimeUntilNextUpdate(remaining);
      
      // Если countdown дошел до 0, обновляем данные (silent режим)
      if (remaining === 0) {
        fetchRating(0, true); // Silent update
      }
    }, 1000);
    
    return () => clearInterval(countdownInterval);
  }, [nextUpdate, enabled, fetchRating]);

  return { 
    articles, 
    loading, 
    error, 
    lastUpdate, 
    nextUpdate,
    timeUntilNextUpdate,
    refetch: fetchRating 
  };
}

