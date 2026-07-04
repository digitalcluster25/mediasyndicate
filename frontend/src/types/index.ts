export interface Channel {
  id: number;
  telegramId: number | null;
  username: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  type: string | null;
  categoryId: number | null;
  category: { id: number; name: string; slug: string } | null;
  country: string | null;
  language: string | null;
  totalScore: number;
  latestStats: ChannelStat | null;
}

export interface ChannelStat {
  id: number;
  channelId: number;
  subscribers: number;
  reactions: number;
  reposts: number;
  comments: number;
  engagementScore: number;
  growthRate: number;
  recordedAt: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  _count: { channels: number };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RankingEntry {
  id: number;
  username: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  type: string | null;
  category: { id: number; name: string; slug: string } | null;
  country: string | null;
  language: string | null;
  latestStats: {
    subscribers: number;
    engagementScore: number;
    growthRate: number;
    recordedAt: string;
  } | null;
  compositeScore: number;
  totalScore: number;
}
