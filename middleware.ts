import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from '@/lib/auth/session';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Пропустить /admin/login БЕЗ проверки сессии
  if (path === '/admin/login' || path.startsWith('/admin/login/')) {
    return NextResponse.next();
  }
  
  // Для всех остальных /admin/* - проверить сессию
  if (path.startsWith('/admin')) {
    const token = request.cookies.get('admin-session')?.value;
    
    if (!token) {
      // Нет токена → редирект на логин
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', path);
      return NextResponse.redirect(loginUrl);
    }
    
    // Проверить валидность токена
    const session = await verifySession(token);
    
    if (!session) {
      // Токен невалиден → редирект на логин
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', path);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*'
};
