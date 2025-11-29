import { useState, useEffect, useCallback } from 'react';
import { POLL_INTERVALS } from '@/lib/constants/rating';

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

export function useLiveRating(options: UseLiveRatingOptions = {}) {
  const { period = 'hour', limit = 50, enabled = true } = options;
  
  const [articles, setArticles] = useState<RatingArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  const fetchRating = useCallback(async () => {
    try {
      const res = await fetch(`/api/rating/live?period=${period}&limit=${limit}`);
      if (!res.ok) throw new Error('Failed to fetch rating');
      
      const data = await res.json();
      setArticles(data.articles);
      setLastUpdate(data.timestamp);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [period, limit]);

  useEffect(() => {
    if (!enabled) return;
    
    fetchRating(); // Initial fetch
    
    const interval = setInterval(fetchRating, POLL_INTERVALS[period]);
    return () => clearInterval(interval);
  }, [fetchRating, period, enabled]);

  return { articles, loading, error, lastUpdate, refetch: fetchRating };
}

