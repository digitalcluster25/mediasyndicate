import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Eye, Heart, Share2, MessageCircle, TrendingUp, Calendar, ExternalLink, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { id } = await params;
  const search = await searchParams;
  const period = search.period || 'hour'; // default: 1 час
  const article = await prisma.article.findUnique({
    where: { id },
    include: { source: true }
  });

  if (!article) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="bg-white rounded-xl p-8 mb-6 border border-slate-200">
          {/* Meta: время, источник, просмотры - ВСЁ ВМЕСТЕ */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mb-4 pb-4 border-b border-slate-200">
            {/* Время */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {formatDistanceToNow(article.publishedAt, { addSuffix: true, locale: ru })}
            </div>
            
            {/* Источник */}
            <div className="font-medium text-slate-900">
              {article.source.name}
          </div>

            {/* Просмотры (если есть) */}
            {article.views > 0 && (
              <div className="flex items-center gap-1 text-slate-600">
                <Eye className="w-4 h-4" />
                <span className="font-medium">{formatNumber(article.views)}</span>
              </div>
            )}
          </div>

          {/* Rating Badge */}
          {article.rating > 0 && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium mb-4">
              <TrendingUp className="w-4 h-4" />
              Рейтинг: {article.rating.toFixed(1)}
            </div>
          )}

          {/* Title */}
          <h1 className="text-2xl font-bold text-slate-900 mb-6">
            {article.title}
          </h1>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
              {article.content}
            </p>
          </div>

          {/* Source Link */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium"
            >
              Читать оригинал <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-6">
          <Link
            href={`/uk/ukraine?period=${period}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-medium transition-colors"
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

