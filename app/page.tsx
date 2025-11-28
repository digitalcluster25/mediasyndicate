import { prisma } from '@/lib/prisma';
import { Calendar, Globe, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const articles = await prisma.article.findMany({
    orderBy: { publishedAt: 'desc' },
    take: 20,
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
        
        <div className="space-y-4">
          {articles.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
              <p className="text-slate-600">Статьи не найдены. Импортируйте фиды для начала.</p>
            </div>
          ) : (
            articles.map((article) => (
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
      </div>
    </div>
  );
}
