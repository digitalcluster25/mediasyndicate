import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// GET - получить промпт по key
export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;

    const prompt = await prisma.prompt.findUnique({
      where: { key },
      include: {
        history: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ prompt });
  } catch (error) {
    console.error('[API Prompt GET Error]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompt' },
      { status: 500 }
    );
  }
}

// PUT - обновить промпт
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const body = await request.json();

    const schema = z.object({
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      content: z.string().min(1).optional(),
      variables: z.record(z.string(), z.string()).optional(),
      isActive: z.boolean().optional()
    });

    const validation = schema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    // Получаем текущий промпт для сохранения в историю
    const currentPrompt = await prisma.prompt.findUnique({
      where: { key }
    });

    if (!currentPrompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    // Сохраняем в историю если изменился content
    if (validation.data.content && validation.data.content !== currentPrompt.content) {
      await prisma.promptHistory.create({
        data: {
          promptId: currentPrompt.id,
          content: currentPrompt.content,
          variables: currentPrompt.variables || {}
        }
      });
    }

    // Обновляем промпт
    const updated = await prisma.prompt.update({
      where: { key },
      data: {
        ...validation.data,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ prompt: updated });
  } catch (error) {
    console.error('[API Prompt PUT Error]:', error);
    return NextResponse.json(
      { error: 'Failed to update prompt' },
      { status: 500 }
    );
  }
}

// DELETE - удалить промпт
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;

    const prompt = await prisma.prompt.findUnique({
      where: { key }
    });

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    await prisma.prompt.delete({
      where: { key }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API Prompt DELETE Error]:', error);
    return NextResponse.json(
      { error: 'Failed to delete prompt' },
      { status: 500 }
    );
  }
}

