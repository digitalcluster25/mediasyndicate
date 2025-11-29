import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// import { getSession } from '@/lib/auth/session'; // ЗАКОММЕНТИРОВАНО
import { z } from 'zod';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // АВТОРИЗАЦИЯ ОТКЛЮЧЕНА ДЛЯ РАЗРАБОТКИ
  // const session = await getSession();
  // if (!session) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  const { id } = await params;

  const source = await prisma.source.findUnique({
    where: { id }
  });

  if (!source) {
    return NextResponse.json(
      { error: 'Source not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ source });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // АВТОРИЗАЦИЯ ОТКЛЮЧЕНА ДЛЯ РАЗРАБОТКИ
  // const session = await getSession();
  // if (!session) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  const { id } = await params;
  const body = await request.json();
  
  const schema = z.object({
    name: z.string().min(1).max(100).optional(), // Минимум 1 символ
    url: z.string().url().optional(),
    isActive: z.boolean().optional()
  });

  const validation = schema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validation.error },
      { status: 400 }
    );
  }

  try {
    const source = await prisma.source.update({
      where: { id },
      data: validation.data
    });

    return NextResponse.json({
      success: true,
      source
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Source not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Update failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // АВТОРИЗАЦИЯ ОТКЛЮЧЕНА ДЛЯ РАЗРАБОТКИ
  // const session = await getSession();
  // if (!session) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  const { id } = await params;

  try {
    await prisma.source.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Source deleted'
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Source not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Delete failed' },
      { status: 500 }
    );
  }
}

