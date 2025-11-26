import { NextResponse } from 'next/server';
import { ImportService } from '@/lib/services/ImportService';

export async function POST() {
  try {
    const result = await ImportService.importAll();
    return NextResponse.json({
      success: true,
      imported: result.imported,
      errors: result.errors,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
