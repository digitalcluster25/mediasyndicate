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
    if (articles.length === 0) {
      prevPositionsRef.current.clear();
      return;
    }

    const currentPositions = new Map(
      articles.map((article, index) => [article.id, index + 1])
    );

    // Находим элементы, которые изменили позицию
    const itemsToAnimate = new Set<string>();
    const firstPositions = new Map<string, { top: number; left: number }>();

    // Сохраняем начальные позиции (First) - после обновления DOM
    requestAnimationFrame(() => {
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

      // Invert - вычисляем смещение после обновления DOM
      requestAnimationFrame(() => {
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

            if (Math.abs(deltaY) > 1 || Math.abs(deltaX) > 1) {
              // Применяем инверсию - перемещаем элемент обратно на старую позицию
              element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
              element.style.transition = 'none';
              element.style.zIndex = '10';
            }
          }
        });

        // Play - запускаем анимацию к новой позиции
        requestAnimationFrame(() => {
          itemsToAnimate.forEach((id) => {
            const element = itemRefsRef.current.get(id);
            if (element) {
              // Плавная анимация с easing функцией как на mediametrics.ru (в 2 раза медленнее)
              element.style.transition = 'transform 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
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
                element.style.zIndex = '';
              }
            });
          }, 1000);
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
              <TrendingUp className="w-8 h-8 text-slate-700" />
              <h1 className="text-3xl font-bold text-slate-900">Live Rating</h1>
            </div>
          </div>
          
          {/* Period Tabs with Clock */}
          <div className="flex items-center gap-3">
            {/* Условные обозначения - скрыты на мобильных */}
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-600 mr-2">
              <div className="flex items-center gap-1">
                <Flame className="w-3 h-3 text-slate-700" />
                <span>горячее</span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-slate-600" />
                <span>новое</span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-slate-700" />
                <span>вверх</span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-slate-500" />
                <span>вниз</span>
              </div>
            </div>
            
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
                  stroke="rgb(71 85 105)"
                  strokeWidth="2"
                  strokeDasharray={`${2 * Math.PI * 16}`}
                  strokeDashoffset={`${2 * Math.PI * 16 * (1 - progress / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <Clock className="absolute inset-0 m-auto w-5 h-5 text-slate-700" />
            </div>
            
            {/* Period Tabs */}
            <div className="flex gap-1 bg-white rounded-lg p-1 shadow-sm">
              {(['online', 'hour', 'day'] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    period === p
                      ? 'bg-slate-700 text-white shadow'
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
          <div className="bg-slate-100 border border-slate-300 rounded-lg p-3 mb-4">
            <p className="text-slate-700 text-sm">{error}</p>
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
                  href={`/article/${article.id}?period=${period}`} 
                  className="block"
                >
                  <article
                    className={`
                      bg-white rounded-lg shadow-sm hover:shadow-md 
                      transition-all duration-200 px-4 py-3 border-l-4
                      ${article.isHot ? 'border-l-slate-700 bg-slate-50/50' : 
                        article.isNew ? 'border-l-slate-500 bg-slate-50/30' : 'border-l-transparent'}
                    `}
                  >
                {/* SINGLE ROW LAYOUT */}
                <div className="flex items-center gap-3">
                  {/* Position Change - скрыто на мобильных */}
                  <div className="hidden md:flex flex-shrink-0 w-14 text-center">
                    {article.positionChange > 0 ? (
                      <span className="inline-flex items-center text-slate-700 text-sm font-semibold">
                        <TrendingUp className="w-4 h-4 mr-0.5" />
                        +{article.positionChange}
                      </span>
                    ) : article.positionChange < 0 ? (
                      <span className="inline-flex items-center text-slate-500 text-sm font-semibold">
                        <TrendingDown className="w-4 h-4 mr-0.5" />
                        {article.positionChange}
                      </span>
                    ) : (
                      <span className="text-slate-300 text-sm">—</span>
                    )}
                  </div>

                  {/* Badges + Source + Title - ALL IN ONE LINE */}
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    {/* Badges - скрыты на мобильных */}
                    {article.isHot && (
                      <span className="hidden md:flex flex-shrink-0 px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-xs font-medium items-center gap-0.5">
                        <Flame className="w-3 h-3" />
                      </span>
                    )}
                    {article.isNew && !article.isHot && (
                      <span className="hidden md:flex flex-shrink-0 px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium items-center gap-0.5">
                        <Sparkles className="w-3 h-3" />
                      </span>
                    )}
                    {/* Source - скрыт на мобильных */}
                    <span className="hidden md:inline flex-shrink-0 text-xs text-slate-400">{article.sourceName}</span>
                    <span className="hidden md:inline text-slate-300">•</span>
                    {/* На мобильных: текст занимает максимум места, оставляя 2ch до рейтинга */}
                    <h2 className="flex-1 min-w-0 text-sm font-medium text-slate-800 hover:text-slate-600 break-words">
                      {article.title}
                    </h2>
                  </div>

                  {/* Rating */}
                  <div className="flex-shrink-0 text-right min-w-[70px]">
                    <span className="text-base font-bold text-slate-700">
                      {Math.round(article.rating)}
                    </span>
                    {/* Показываем дельту только если она не равна 0 */}
                    {article.ratingDelta !== 0 && Math.round(article.ratingDelta) !== 0 && (
                      <span className={`ml-1 text-xs font-medium ${
                        article.ratingDelta > 0 ? 'text-slate-700' : 'text-slate-500'
                      }`}>
                        {article.ratingDelta > 0 ? '+' : ''}{Math.round(article.ratingDelta)}
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

