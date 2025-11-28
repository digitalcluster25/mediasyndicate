import { prisma } from '@/lib/prisma';
import { Calendar, Globe, ExternalLink, TrendingUp, Eye, Share2, Heart, MessageCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function Home() {
  // Получаем последние статьи
  const recentArticles = await prisma.article.findMany({
    orderBy: { publishedAt: 'desc' },
    take: 10,
    include: {
      source: true,
    },
  });

  // Получаем популярные статьи по рейтингу
  const popularArticles = await prisma.article.findMany({
    orderBy: { rating: 'desc' },
    take: 10,
    include: {
      source: true,
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-950 mb-2">MediaSyndicate</h1>
          <p className="text-slate-600">Агрегатор новостей из RSS и Telegram каналов</p>
        </div>

        {/* Секция "Популярное" */}
        {popularArticles.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <h2 className="text-2xl font-bold text-slate-950">Популярное</h2>
            </div>
            <div className="space-y-4">
              {popularArticles.map((article) => (
                <article 
                  key={article.id} 
                  className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="text-lg font-semibold text-slate-950 flex-1">
                      <a 
                        href={article.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="hover:text-blue-600 transition-colors flex items-center gap-2"
                      >
                        {article.title}
                        <ExternalLink className="h-4 w-4 text-slate-400" />
                      </a>
                    </h3>
                    {article.rating > 0 && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm font-medium">
                        <TrendingUp className="h-3 w-3" />
                        {article.rating.toFixed(1)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-600 mb-3 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Globe className="h-4 w-4" />
                      {article.source.name}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(article.publishedAt).toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    {(article.views > 0 || article.forwards > 0 || article.reactions > 0 || article.replies > 0) && (
                      <div className="flex items-center gap-3 ml-auto">
                        {article.views > 0 && (
                          <div className="flex items-center gap-1" title="Просмотры">
                            <Eye className="h-3 w-3" />
                            <span>{article.views}</span>
                          </div>
                        )}
                        {article.forwards > 0 && (
                          <div className="flex items-center gap-1" title="Пересылки">
                            <Share2 className="h-3 w-3" />
                            <span>{article.forwards}</span>
                          </div>
                        )}
                        {article.reactions > 0 && (
                          <div className="flex items-center gap-1" title="Реакции">
                            <Heart className="h-3 w-3" />
                            <span>{article.reactions}</span>
                          </div>
                        )}
                        {article.replies > 0 && (
                          <div className="flex items-center gap-1" title="Ответы">
                            <MessageCircle className="h-3 w-3" />
                            <span>{article.replies}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {article.content && (
                    <p className="text-slate-700 line-clamp-2 leading-relaxed">{article.content}</p>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Секция "Последние новости" */}
        <section>
          <h2 className="text-2xl font-bold text-slate-950 mb-4">Последние новости</h2>
          <div className="space-y-4">
            {recentArticles.length === 0 ? (
              <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
                <p className="text-slate-600">Статьи не найдены. Импортируйте фиды для начала.</p>
              </div>
            ) : (
              recentArticles.map((article) => (
                <article 
                  key={article.id} 
                  className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6"
                >
                  <h2 className="text-xl font-semibold text-slate-950 mb-3">
                    <a 
                      href={article.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="hover:text-blue-600 transition-colors flex items-center gap-2"
                    >
                      {article.title}
                      <ExternalLink className="h-4 w-4 text-slate-400" />
                    </a>
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Globe className="h-4 w-4" />
                      {article.source.name}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(article.publishedAt).toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                  {article.content && (
                    <p className="text-slate-700 line-clamp-3 leading-relaxed">{article.content}</p>
                  )}
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
