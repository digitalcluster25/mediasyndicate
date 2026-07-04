import { useParams, Link } from 'react-router-dom';
import { useChannel, useChannelStats } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, TrendingUp, MessageCircle, Share2, Heart, Star, ExternalLink } from 'lucide-react';

export default function ChannelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const channelId = parseInt(id || '0');
  const { data: channel, isLoading } = useChannel(channelId);
  const { data: stats } = useChannelStats(channelId, 30);

  if (isLoading) return <div className="max-w-4xl mx-auto px-4 py-8"><div className="h-64 bg-gray-100 animate-pulse rounded-xl" /></div>;
  if (!channel) return <div className="max-w-4xl mx-auto px-4 py-8"><p className="text-gray-500">Канал не найден.</p></div>;

  const latest = channel.stats?.[channel.stats.length - 1];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link to="/">
        <Button variant="ghost" size="sm" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Назад к рейтингу
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-2xl">{channel.title}</CardTitle>
              <CardDescription className="text-base mt-1">
                @{channel.username}
                {channel.category && <Badge className="ml-2" variant="secondary">{channel.category.name}</Badge>}
              </CardDescription>
              {channel.description && <p className="text-gray-600 mt-3">{channel.description}</p>}
            </div>
            <a href={`https://t.me/${channel.username}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-1" /> Открыть в Telegram
              </Button>
            </a>
          </div>
        </CardHeader>

        <CardContent>
          {/* Stats cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-5 w-5 mx-auto text-gray-400 mb-1" />
                <p className="text-2xl font-bold">{latest?.subscribers?.toLocaleString() || '—'}</p>
                <p className="text-xs text-gray-500">Подписчики</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <MessageCircle className="h-5 w-5 mx-auto text-gray-400 mb-1" />
                <p className="text-2xl font-bold">{latest?.engagementScore?.toFixed(1) || '—'}</p>
                <p className="text-xs text-gray-500">Engagement Score</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-5 w-5 mx-auto text-gray-400 mb-1" />
                <p className={`text-2xl font-bold ${(latest?.growthRate || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {latest?.growthRate?.toFixed(1) || '—'}%
                </p>
                <p className="text-xs text-gray-500">Темп роста</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Star className="h-5 w-5 mx-auto text-gray-400 mb-1" />
                <p className="text-2xl font-bold">
                  {channel.expertRatingAvg ? `${channel.expertRatingAvg.toFixed(1)} ⭐` : '—'}
                </p>
                <p className="text-xs text-gray-500">Экспертная ({channel.expertRatingCount})</p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed numbers */}
          {latest && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <Heart className="h-4 w-4 mx-auto text-red-400 mb-1" />
                <p className="font-semibold">{latest.reactions.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Реакции (24ч)</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <Share2 className="h-4 w-4 mx-auto text-blue-400 mb-1" />
                <p className="font-semibold">{latest.reposts.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Репосты (24ч)</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <MessageCircle className="h-4 w-4 mx-auto text-green-400 mb-1" />
                <p className="font-semibold">{latest.comments.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Комментарии (24ч)</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <Star className="h-4 w-4 mx-auto text-yellow-400 mb-1" />
                <p className="font-semibold">{channel.totalScore.toFixed(1)}</p>
                <p className="text-xs text-gray-500">Общий балл</p>
              </div>
            </div>
          )}

          {/* 30-day chart (simple table) */}
          {stats && stats.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Динамика за 30 дней</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-gray-500 font-medium">Дата</th>
                      <th className="text-right py-2 text-gray-500 font-medium">Подписчики</th>
                      <th className="text-right py-2 text-gray-500 font-medium">ER</th>
                      <th className="text-right py-2 text-gray-500 font-medium">Рост %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.map((s) => (
                      <tr key={s.id} className="border-b border-gray-100">
                        <td className="py-2 text-gray-900">{new Date(s.recordedAt).toLocaleDateString()}</td>
                        <td className="text-right py-2">{s.subscribers.toLocaleString()}</td>
                        <td className="text-right py-2">{s.engagementScore.toFixed(1)}</td>
                        <td className={`text-right py-2 ${s.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {s.growthRate.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
