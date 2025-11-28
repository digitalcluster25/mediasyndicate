import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// GET - получить все промпты
export async function GET() {
  try {
    const prompts = await prisma.prompt.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        history: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return NextResponse.json({ prompts });
  } catch (error) {
    console.error('[API Prompts GET Error]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompts' },
      { status: 500 }
    );
  }
}

// POST - создать новый промпт
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const schema = z.object({
      key: z.string().min(1).regex(/^[a-z0-9_]+$/, 'Key must contain only lowercase letters, numbers, and underscores'),
      name: z.string().min(1),
      description: z.string().optional(),
      content: z.string().min(1),
      variables: z.record(z.string(), z.string()).optional(),
      isActive: z.boolean().optional().default(true)
    });

    const validation = schema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { key, name, description, content, variables, isActive } = validation.data;

    // Проверяем что key уникален
    const existing = await prisma.prompt.findUnique({
      where: { key }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Prompt with this key already exists' },
        { status: 409 }
      );
    }

    const prompt = await prisma.prompt.create({
      data: {
        key,
        name,
        description,
        content,
        variables: variables || {},
        isActive: isActive ?? true
      }
    });

    return NextResponse.json({ prompt }, { status: 201 });
  } catch (error) {
    console.error('[API Prompts POST Error]:', error);
    return NextResponse.json(
      { error: 'Failed to create prompt' },
      { status: 500 }
    );
  }
}

