Исправь ошибку загрузки sources:

1. Открой app/api/admin/sources/route.ts

2. Оберни код в try-catch чтобы видеть ошибку:

```typescript
export async function GET() {
  try {
    const sources = await prisma.source.findMany({
      include: {
        _count: {
          select: { articles: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const sourcesWithImport = await Promise.all(
      sources.map(async (source) => {
        const lastArticle = await prisma.article.findFirst({
          where: { sourceId: source.id },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true }
        });

        return {
          id: source.id,
          name: source.name,
          type: source.type,
          url: source.url,
          isActive: source.isActive,
          articlesCount: source._count.articles,
          lastImportAt: lastArticle?.createdAt || null,
          createdAt: source.createdAt,
          updatedAt: source.updatedAt
        };
      })
    );

    return NextResponse.json({
      sources: sourcesWithImport,
      total: sources.length
    });
  } catch (error) {
    console.error('Sources API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch sources',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
```

3. Запусти:
npm run build
git add .
git commit -m "fix: add error handling to sources API"
git push

4. После деплоя открой в браузере DevTools Console и посмотри какая ошибка приходит от API
