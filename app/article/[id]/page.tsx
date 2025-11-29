import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Eye, Heart, Share2, MessageCircle, TrendingUp, Calendar, ExternalLink, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { uk, ru, enUS } from 'date-fns/locale';
import Link from 'next/link';

const localeMap = { uk, ru, en: enUS };

export const dynamic = 'force-dynamic';

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await prisma.article.findUnique({
    where: { id },
    include: { source: true }
  });

  if (!article) {
    notFound();
  }

  // Используем английскую локаль по умолчанию
  const locale = enUS;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          {/* Rating Badge */}
          {article.rating > 0 && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium mb-4">
              <TrendingUp className="w-4 h-4" />
              Rating: {article.rating.toFixed(1)}
            </div>
          )}

          {/* Title - уменьшен в 2 раза */}
          <h1 className="text-2xl font-bold text-slate-900 mb-6">
            {article.title}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-6 text-sm text-slate-600 mb-6 pb-6 border-b">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {formatDistanceToNow(article.publishedAt, { addSuffix: true, locale })}
            </div>
            <div className="font-medium text-slate-900">
              {article.source.name}
            </div>
          </div>

          {/* Engagement Metrics */}
          <div className="flex items-center gap-6 text-slate-600 mb-8">
            {article.views > 0 && (
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                <span className="font-medium">{formatNumber(article.views)}</span>
              </div>
            )}
            {article.reactions > 0 && (
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                <span className="font-medium">{formatNumber(article.reactions)}</span>
              </div>
            )}
            {article.forwards > 0 && (
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                <span className="font-medium">{formatNumber(article.forwards)}</span>
              </div>
            )}
            {article.replies > 0 && (
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <span className="font-medium">{formatNumber(article.replies)}</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
              {article.content}
            </p>
          </div>

          {/* Source Link */}
          <div className="mt-8 pt-6 border-t">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-700 font-medium"
            >
              View Original <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md text-slate-700 hover:text-slate-900 font-medium transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад к рейтингу
          </Link>
        </div>
      </div>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

