import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// import { getSession } from '@/lib/auth/session'; // ЗАКОММЕНТИРОВАНО
import { z } from 'zod';

export async function GET() {
  // АВТОРИЗАЦИЯ ОТКЛЮЧЕНА ДЛЯ РАЗРАБОТКИ
  // const session = await getSession();
  // if (!session) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  // Получить источники с подсчетом статей
  const sources = await prisma.source.findMany({
    include: {
      _count: {
        select: { articles: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Получить lastImportAt для каждого источника
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
}

export async function POST(request: Request) {
  // АВТОРИЗАЦИЯ ОТКЛЮЧЕНА ДЛЯ РАЗРАБОТКИ
  // const session = await getSession();
  // if (!session) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  const body = await request.json();
  
  // Валидация
  const schema = z.object({
    name: z.string().min(3).max(100),
    type: z.enum(['RSS', 'TELEGRAM']),
    url: z.string().url().optional(),
    isActive: z.boolean().default(true)
  });

  const validation = schema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed',
        details: validation.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  const data = validation.data;

  // Проверка на дубликат URL
  if (data.url) {
    const existing = await prisma.source.findUnique({
      where: { url: data.url }
    });
    
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Source with this URL already exists'
        },
        { status: 409 }
      );
    }
  }

  // Создать источник
  const source = await prisma.source.create({
    data: {
      name: data.name,
      type: data.type,
      url: data.url || '',
      isActive: data.isActive
    }
  });

  return NextResponse.json(
    {
      success: true,
      source
    },
    { status: 201 }
  );
}

