'use client';

import { useLiveRating } from '@/hooks/useLiveRating';
import { TrendingUp, TrendingDown, Flame, Sparkles, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

type Period = 'online' | 'hour' | 'day';

const PERIOD_LABELS: Record<Period, string> = {
  online: '10 минут',
  hour: '1 час',
  day: '24 часа'
};

const PERIOD_INTERVALS: Record<Period, number> = {
  online: 30_000,
  hour: 60_000,
  day: 300_000
};

export function LiveRating() {
  const [period, setPeriod] = useState<Period>('hour');
  const { articles, loading, error, lastUpdate, timeUntilNextUpdate, refetch } = 
    useLiveRating({ period, limit: 50 });

  // Прогресс для countdown (0-100%)
  const totalInterval = PERIOD_INTERVALS[period];
  const progress = totalInterval > 0 
    ? Math.min(100, ((totalInterval - timeUntilNextUpdate) / totalInterval) * 100)
    : 0;
  
  const secondsUntilUpdate = Math.ceil(timeUntilNextUpdate / 1000);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <TrendingUp className="w-8 h-8 text-orange-600" />
              <h1 className="text-3xl font-bold text-slate-900">Live Rating</h1>
            </div>
            <p className="text-sm text-slate-500">
              Обновлено: {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : '...'}
            </p>
          </div>
          
          {/* Period Tabs */}
          <div className="flex gap-1 bg-white rounded-lg p-1 shadow-sm">
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

        {/* Countdown Progress Bar */}
        <div className="mb-4 bg-white rounded-lg p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600 flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Следующее обновление
            </span>
            <span className="text-sm font-mono font-medium text-orange-600">
              {secondsUntilUpdate > 0 ? `${secondsUntilUpdate}с` : 'Обновление...'}
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && articles.length === 0 && (
          <div className="text-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full mx-auto" />
          </div>
        )}

        {/* Article List - SINGLE LINE CARDS */}
        <div className="space-y-2">
          {articles.map((article, index) => (
            <Link key={article.id} href={`/article/${article.id}`} className="block">
              <article
                className={`
                  bg-white rounded-lg shadow-sm hover:shadow-md 
                  transition-all duration-200 px-4 py-3 border-l-4
                  ${article.isHot ? 'border-l-red-500 bg-red-50/50' : 
                    article.isNew ? 'border-l-yellow-500 bg-yellow-50/50' : 'border-l-transparent'}
                `}
              >
                {/* SINGLE ROW LAYOUT */}
                <div className="flex items-center gap-3">
                  {/* Position */}
                  <div className={`
                    flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center 
                    text-sm font-bold text-white
                    ${index < 3 ? 'bg-orange-500' : 'bg-slate-400'}
                  `}>
                    {index + 1}
                  </div>

                  {/* Position Change */}
                  <div className="flex-shrink-0 w-14 text-center">
                    {article.positionChange > 0 ? (
                      <span className="inline-flex items-center text-green-600 text-sm font-semibold">
                        <TrendingUp className="w-4 h-4 mr-0.5" />
                        +{article.positionChange}
                      </span>
                    ) : article.positionChange < 0 ? (
                      <span className="inline-flex items-center text-red-600 text-sm font-semibold">
                        <TrendingDown className="w-4 h-4 mr-0.5" />
                        {article.positionChange}
                      </span>
                    ) : (
                      <span className="text-slate-300 text-sm">—</span>
                    )}
                  </div>

                  {/* Badges + Source + Title - ALL IN ONE LINE */}
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    {article.isHot && (
                      <span className="flex-shrink-0 px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-xs font-medium flex items-center gap-0.5">
                        <Flame className="w-3 h-3" />
                      </span>
                    )}
                    {article.isNew && !article.isHot && (
                      <span className="flex-shrink-0 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium flex items-center gap-0.5">
                        <Sparkles className="w-3 h-3" />
                      </span>
                    )}
                    <span className="flex-shrink-0 text-xs text-slate-400">{article.sourceName}</span>
                    <span className="text-slate-300">•</span>
                    <h2 className="truncate text-sm font-medium text-slate-800 hover:text-orange-600">
                      {article.title}
                    </h2>
                  </div>

                  {/* Rating */}
                  <div className="flex-shrink-0 text-right min-w-[70px]">
                    <span className="text-base font-bold text-orange-600">
                      {article.rating.toFixed(1)}
                    </span>
                    {article.ratingDelta !== 0 && (
                      <span className={`ml-1 text-xs font-medium ${
                        article.ratingDelta > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {article.ratingDelta > 0 ? '+' : ''}{article.ratingDelta.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {/* Empty */}
        {!loading && articles.length === 0 && (
          <div className="text-center py-20">
            <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Нет статей</p>
          </div>
        )}
      </div>
    </div>
  );
}

