import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Eye, Heart, Share2, MessageCircle, TrendingUp } from 'lucide-react';
import { RatingService } from '@/lib/services/RatingService';

export const dynamic = 'force-dynamic';

export default async function Home() {
  // Получить только trending статьи
  const trending = await RatingService.getTrending(50);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-orange-600" />
            <h1 className="text-4xl font-bold text-slate-900">Trending News</h1>
          </div>
          <p className="text-slate-600">
            Top {trending.length} most engaging stories right now
          </p>
        </div>

        {/* Trending List */}
        <div className="space-y-4">
          {trending.map((article, index) => (
            <Link
              key={article.id}
              href={`/article/${article.id}`}
              className="block"
            >
              <article className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 p-6 border border-slate-200 hover:border-orange-300">
                <div className="flex items-start gap-4">
                  {/* Rank */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                    {index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Rating Badge */}
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                        <TrendingUp className="w-3 h-3" />
                        {article.rating.toFixed(1)}
                      </span>
                      <span className="text-xs text-slate-500">
                        {article.source.name}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-semibold text-slate-900 mb-3 line-clamp-2 hover:text-orange-600 transition-colors">
                      {article.title}
                    </h2>

                    {/* Metrics */}
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      {article.views > 0 && (
                        <span className="flex items-center gap-1.5">
                          <Eye className="w-4 h-4" />
                          {formatNumber(article.views)}
                        </span>
                      )}
                      {article.reactions > 0 && (
                        <span className="flex items-center gap-1.5">
                          <Heart className="w-4 h-4" />
                          {formatNumber(article.reactions)}
                        </span>
                      )}
                      {article.forwards > 0 && (
                        <span className="flex items-center gap-1.5">
                          <Share2 className="w-4 h-4" />
                          {formatNumber(article.forwards)}
                        </span>
                      )}
                      {article.replies > 0 && (
                        <span className="flex items-center gap-1.5">
                          <MessageCircle className="w-4 h-4" />
                          {formatNumber(article.replies)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {trending.length === 0 && (
          <div className="text-center py-20">
            <TrendingUp className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">
              No trending articles yet. Check back soon!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}
