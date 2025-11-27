import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';

export async function middleware(request: NextRequest) {
  // Защита всех /admin/* роутов (кроме /admin/login)
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Разрешить доступ к /admin/login
    if (request.nextUrl.pathname === '/admin/login') {
      return NextResponse.next();
    }

    // Проверить сессию
    const session = await getSession();
    
    if (!session) {
      // Нет сессии → редирект на логин
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*'
};

