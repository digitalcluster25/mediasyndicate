import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useRanking, useCategories } from '@/hooks/useApi';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, TrendingUp, MessageCircle, ChevronLeft, ChevronRight, Star } from 'lucide-react';

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

export default function RankingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');
  const categoryId = searchParams.get('category') || undefined;
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryId || '');

  const { data, isLoading } = useRanking({ page, categoryId: selectedCategory || undefined } as Record<string, string | number>);
  const { data: categories } = useCategories();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Рейтинг Telegram-каналов</h1>
          <p className="text-gray-500 mt-1">Независимый рейтинг на основе подписчиков, вовлечённости, роста и экспертных оценок</p>
        </div>
      </div>

      {/* Category filter */}
      {categories && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => { setSelectedCategory(''); setSearchParams({}); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!selectedCategory ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Все
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(String(cat.id)); setSearchParams({ category: String(cat.id) }); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedCategory === String(cat.id) ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {cat.name} ({cat._count.channels})
            </button>
          ))}
        </div>
      )}

      {/* Ranking list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {data?.data.map((channel, idx) => (
            <Link key={channel.id} to={`/channels/${channel.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex-shrink-0 w-10 text-center">
                    {idx < 3 ? (
                      <Trophy className={`h-6 w-6 mx-auto ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : 'text-amber-600'}`} />
                    ) : (
                      <span className="text-lg font-bold text-gray-400">{idx + 1}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 truncate">{channel.title}</h3>
                      {channel.category && <Badge variant="secondary">{channel.category.name}</Badge>}
                      {channel.country && <Badge variant="outline">{channel.country}</Badge>}
                    </div>
                    <p className="text-sm text-gray-500 truncate">@{channel.username}</p>
                  </div>

                  <div className="hidden sm:flex items-center gap-6 text-sm">
                    {channel.latestStats && (
                      <>
                        <div className="text-center">
                          <p className="text-gray-400">Подписчики</p>
                          <p className="font-semibold">{formatNumber(channel.latestStats.subscribers)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-400 flex items-center gap-1"><MessageCircle className="h-3 w-3" /> ER</p>
                          <p className="font-semibold">{channel.latestStats.engagementScore.toFixed(1)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-400 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Рост</p>
                          <p className={`font-semibold ${channel.latestStats.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {channel.latestStats.growthRate.toFixed(1)}%
                          </p>
                        </div>
                      </>
                    )}
                    <div className="text-center min-w-[70px]">
                      <p className="text-gray-400 flex items-center gap-1"><Star className="h-3 w-3" /> Баллы</p>
                      <p className="font-bold text-lg">{channel.compositeScore.toFixed(0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data?.pagination && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-500">
            Показано {(page - 1) * data.pagination.limit + 1}–{Math.min(page * data.pagination.limit, data.pagination.total)} из {data.pagination.total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm"
              disabled={page <= 1}
              onClick={() => setSearchParams({ page: String(page - 1), ...(selectedCategory ? { category: selectedCategory } : {}) })}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline" size="sm"
              disabled={page >= data.pagination.totalPages}
              onClick={() => setSearchParams({ page: String(page + 1), ...(selectedCategory ? { category: selectedCategory } : {}) })}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
