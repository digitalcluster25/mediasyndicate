import { prisma } from '@/lib/prisma';

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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">MediaSyndicate</h1>
        
        <div className="space-y-4">
          {articles.length === 0 ? (
            <p className="text-gray-600">No articles found. Import feeds to get started.</p>
          ) : (
            articles.map((article) => (
              <div key={article.id} className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {article.title}
                  </a>
                </h2>
                <p className="text-sm text-gray-500 mb-2">
                  {article.source.name} • {new Date(article.publishedAt).toLocaleDateString()}
                </p>
                {article.content && (
                  <p className="text-gray-700 line-clamp-3">{article.content}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
