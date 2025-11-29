'use client';

import { useLiveRating } from '@/hooks/useLiveRating';
import { TrendingUp, TrendingDown, Flame, Sparkles, Clock } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

type Period = 'online' | 'hour' | 'day';

const PERIOD_LABELS: Record<Period, string> = {
  online: '10 минут',
  hour: '1 час',
  day: '24 часа'
};

// Фиксированный интервал обновления метрик (30 секунд)
const METRICS_UPDATE_INTERVAL = 30_000;

export function LiveRating() {
  const [period, setPeriod] = useState<Period>('hour');
  const { articles, loading, error, timeUntilNextUpdate } = 
    useLiveRating({ period, limit: 50 });
  
  // Отслеживаем предыдущие позиции и DOM элементы для FLIP анимации
  const prevPositionsRef = useRef<Map<string, number>>(new Map());
  const itemRefsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const [animatingItems, setAnimatingItems] = useState<Set<string>>(new Set());

  // Прогресс для часов (0-100%) - всегда 30 секунд
  const progress = timeUntilNextUpdate > 0
    ? Math.min(100, ((METRICS_UPDATE_INTERVAL - timeUntilNextUpdate) / METRICS_UPDATE_INTERVAL) * 100)
    : 0;

  // FLIP анимация (First, Last, Invert, Play) для плавного перемещения
  useEffect(() => {
    if (articles.length === 0) return;

    const currentPositions = new Map(
      articles.map((article, index) => [article.id, index + 1])
    );

    // Находим элементы, которые изменили позицию
    const itemsToAnimate = new Set<string>();
    const firstPositions = new Map<string, { top: number; left: number }>();

    // Сохраняем начальные позиции (First)
    currentPositions.forEach((currentPos, id) => {
      const prevPos = prevPositionsRef.current.get(id);
      if (prevPos !== undefined && prevPos !== currentPos) {
        itemsToAnimate.add(id);
        const element = itemRefsRef.current.get(id);
        if (element) {
          const rect = element.getBoundingClientRect();
          firstPositions.set(id, {
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX
          });
        }
      }
    });

    if (itemsToAnimate.size === 0) {
      prevPositionsRef.current = currentPositions;
      return;
    }

    // Запускаем анимацию
    setAnimatingItems(itemsToAnimate);

    // Используем requestAnimationFrame для плавной анимации
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Invert - вычисляем смещение
        itemsToAnimate.forEach((id) => {
          const element = itemRefsRef.current.get(id);
          if (element && firstPositions.has(id)) {
            const first = firstPositions.get(id)!;
            const rect = element.getBoundingClientRect();
            const last = {
              top: rect.top + window.scrollY,
              left: rect.left + window.scrollX
            };

            const deltaY = first.top - last.top;
            const deltaX = first.left - last.left;

            if (deltaY !== 0 || deltaX !== 0) {
              // Применяем инверсию
              element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
              element.style.transition = 'none';
            }
          }
        });

        // Play - запускаем анимацию
        requestAnimationFrame(() => {
          itemsToAnimate.forEach((id) => {
            const element = itemRefsRef.current.get(id);
            if (element) {
              element.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
              element.style.transform = 'translate(0, 0)';
            }
          });

          // Очищаем состояние анимации после завершения
          setTimeout(() => {
            setAnimatingItems(new Set());
            itemsToAnimate.forEach((id) => {
              const element = itemRefsRef.current.get(id);
              if (element) {
                element.style.transition = '';
                element.style.transform = '';
              }
            });
          }, 600);
        });
      });
    });

    prevPositionsRef.current = currentPositions;
  }, [articles]);

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
          </div>
          
          {/* Period Tabs with Clock */}
          <div className="flex items-center gap-3">
            {/* Clock Icon with Progress Ring */}
            <div className="relative w-10 h-10 flex-shrink-0">
              <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 36 36">
                {/* Background circle */}
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="rgb(226 232 240)"
                  strokeWidth="2"
                />
                {/* Progress circle */}
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="rgb(249 115 22)"
                  strokeWidth="2"
                  strokeDasharray={`${2 * Math.PI * 16}`}
                  strokeDashoffset={`${2 * Math.PI * 16 * (1 - progress / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <Clock className="absolute inset-0 m-auto w-5 h-5 text-orange-600" />
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
        </div>

        {/* Error - только если критично */}
        {error && articles.length === 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Article List - SINGLE LINE CARDS with FLIP Animation */}
        <div className="space-y-2 relative">
          {articles.map((article, index) => {
            const currentPosition = index + 1;
            const prevPosition = prevPositionsRef.current.get(article.id);
            const positionChange = prevPosition ? prevPosition - currentPosition : 0;
            const isAnimating = animatingItems.has(article.id);
            
            return (
              <div
                key={article.id}
                ref={(el) => {
                  if (el) {
                    itemRefsRef.current.set(article.id, el);
                  } else {
                    itemRefsRef.current.delete(article.id);
                  }
                }}
                className="relative"
                style={{
                  zIndex: isAnimating ? 10 : 1,
                  willChange: isAnimating ? 'transform' : 'auto',
                }}
              >
                <Link 
                  href={`/article/${article.id}`} 
                  className="block"
                >
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
              </div>
            );
          })}
        </div>

        {/* Empty */}
        {articles.length === 0 && (
          <div className="text-center py-20">
            <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Нет статей</p>
          </div>
        )}
      </div>
    </div>
  );
}

