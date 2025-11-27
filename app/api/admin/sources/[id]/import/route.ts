import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { ImportService } from '@/lib/services/ImportService';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const startTime = Date.now();

  try {
    const result = await ImportService.importFromSource(id);
    
    const duration = (Date.now() - startTime) / 1000;

    return NextResponse.json({
      success: true,
      imported: result.imported,
      errors: result.errors,
      duration
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Import failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

