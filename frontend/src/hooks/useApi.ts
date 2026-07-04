import { useQuery } from '@tanstack/react-query';

const API = '/api';

async function fetchJSON<T>(url: string, params?: Record<string, string | number>): Promise<T> {
  const qs = params ? '?' + new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)]),
  ).toString() : '';
  const res = await fetch(`${API}${url}${qs}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function useRanking(params: Record<string, string | number>) {
  return useQuery({
    queryKey: ['ranking', params],
    queryFn: () => fetchJSON<{
      data: import('@/types').RankingEntry[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>('/ranking', params),
  });
}

export function useChannels(params: Record<string, string | number>) {
  return useQuery({
    queryKey: ['channels', params],
    queryFn: () => fetchJSON<{
      data: import('@/types').Channel[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>('/channels', params),
  });
}

export function useChannel(id: number) {
  return useQuery({
    queryKey: ['channel', id],
    queryFn: () => fetchJSON<import('@/types').Channel & {
      stats: import('@/types').ChannelStat[];
      expertRatingAvg: number | null;
      expertRatingCount: number;
    }>(`/channels/${id}`),
    enabled: !!id,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => fetchJSON<import('@/types').Category[]>('/categories'),
  });
}

export function useChannelStats(channelId: number, days = 30) {
  return useQuery({
    queryKey: ['stats', channelId, days],
    queryFn: () => fetchJSON<import('@/types').ChannelStat[]>(`/stats/${channelId}`, { days }),
    enabled: !!channelId,
  });
}
