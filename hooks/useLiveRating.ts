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
  online: 10_000,   // 10 сек - проверяем чаще чтобы видеть countdown
  hour: 15_000,     // 15 сек
  day: 30_000       // 30 сек
};

export function useLiveRating(options: UseLiveRatingOptions = {}) {
  const { period = 'hour', limit = 50, enabled = true } = options;
  
  const [articles, setArticles] = useState<RatingArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const [nextUpdate, setNextUpdate] = useState<number>(0);
  const [timeUntilNextUpdate, setTimeUntilNextUpdate] = useState<number>(0);

  const fetchRating = useCallback(async () => {
    try {
      const res = await fetch(`/api/rating/live?period=${period}&limit=${limit}`);
      if (!res.ok) throw new Error('Failed to fetch rating');
      
      const data = await res.json();
      setArticles(data.articles);
      setLastUpdate(data.lastUpdate);
      setNextUpdate(data.nextUpdate);
      setTimeUntilNextUpdate(data.timeUntilNextUpdate);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [period, limit]);

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
      
      // Если countdown дошел до 0, обновляем данные
      if (remaining === 0) {
        fetchRating();
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

