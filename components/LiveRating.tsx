'use client';

import { useLiveRating } from '@/hooks/useLiveRating';
import { Eye, Heart, Share2, MessageCircle, TrendingUp, TrendingDown, Flame, Sparkles } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

type Period = 'online' | 'hour' | 'day';

const PERIOD_LABELS: Record<Period, string> = {
  online: '10 минут',
  hour: '1 час',
  day: '24 часа'
};

export function LiveRating() {
  const [period, setPeriod] = useState<Period>('hour');
  const { articles, loading, error, lastUpdate } = useLiveRating({ period, limit: 50 });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header с выбором периода */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-8 h-8 text-orange-600" />
              <h1 className="text-4xl font-bold text-slate-900">Live Rating</h1>
            </div>
            <p className="text-slate-600">
              Обновлено: {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : '...'}
            </p>
          </div>
          
          {/* Period Tabs */}
          <div className="flex gap-2 bg-white rounded-lg p-1 shadow-sm">
            {(['online', 'hour', 'day'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  period === p
                    ? 'bg-orange-500 text-white shadow'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-600">Ошибка загрузки: {error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && articles.length === 0 && (
          <div className="text-center py-20">
            <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-slate-500 mt-4">Загрузка рейтинга...</p>
          </div>
        )}

        {/* Article List with Animations */}
        <div className="space-y-3">
          {articles.map((article, index) => (
            <Link
              key={article.id}
              href={`/article/${article.id}`}
              className="block"
            >
              <article
                className={`
                  bg-white rounded-xl shadow-sm hover:shadow-lg 
                  transition-all duration-300 p-4 border-2
                  ${article.isHot ? 'border-red-400 bg-red-50' : 'border-transparent'}
                  ${article.isNew && !article.isHot ? 'bg-yellow-50' : ''}
                `}
                style={{
                  // CSS transition для плавного перемещения
                  transform: `translateY(0)`,
                  transition: 'transform 0.5s ease-out'
                }}
              >
                <div className="flex items-center gap-4">
                  {/* Position Badge */}
                  <div className={`
                    flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center 
                    font-bold text-white
                    ${index < 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600' : 'bg-slate-400'}
                  `}>
                    {index + 1}
                  </div>

                  {/* Position Change Indicator */}
                  <div className="w-12 flex-shrink-0">
                    {article.positionChange > 0 && (
                      <div className="flex items-center text-green-600 text-sm font-medium">
                        <TrendingUp className="w-4 h-4" />
                        <span>+{article.positionChange}</span>
                      </div>
                    )}
                    {article.positionChange < 0 && (
                      <div className="flex items-center text-red-600 text-sm font-medium">
                        <TrendingDown className="w-4 h-4" />
                        <span>{article.positionChange}</span>
                      </div>
                    )}
                    {article.positionChange === 0 && (
                      <div className="text-slate-400 text-sm">—</div>
                    )}
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {/* Hot Badge */}
                      {article.isHot && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-medium">
                          <Flame className="w-3 h-3" />
                          HOT
                        </span>
                      )}
                      {/* New Badge */}
                      {article.isNew && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                          <Sparkles className="w-3 h-3" />
                          NEW
                        </span>
                      )}
                      <span className="text-xs text-slate-500">{article.sourceName}</span>
                    </div>
                    
                    <h2 className="text-lg font-semibold text-slate-900 line-clamp-1 hover:text-orange-600 transition-colors">
                      {article.title}
                    </h2>
                  </div>

                  {/* Rating with Delta */}
                  <div className="flex-shrink-0 text-right">
                    <div className="text-lg font-bold text-orange-600">
                      {article.rating.toFixed(1)}
                    </div>
                    {article.ratingDelta !== 0 && (
                      <div className={`text-xs font-medium ${
                        article.ratingDelta > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {article.ratingDelta > 0 ? '+' : ''}{article.ratingDelta.toFixed(1)}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {!loading && articles.length === 0 && (
          <div className="text-center py-20">
            <TrendingUp className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">Нет статей в рейтинге</p>
          </div>
        )}
      </div>
    </div>
  );
}

