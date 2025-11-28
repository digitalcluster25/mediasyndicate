import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  const session = await getSession();
  
  // Получить все cookies
  const cookies = request.cookies.getAll();
  
  return NextResponse.json({
    session: session || null,
    cookies: cookies.map(c => ({ name: c.name, hasValue: !!c.value })),
    headers: {
      cookie: request.headers.get('cookie') || 'none'
    }
  });
}

