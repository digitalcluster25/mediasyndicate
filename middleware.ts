import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from '@/lib/auth/session';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Пропустить /adminko-login
  if (path === '/adminko-login' || path.startsWith('/adminko-login/')) {
    return NextResponse.next();
  }
  
  // Проверить сессию для /adminko/*
  if (path.startsWith('/adminko/')) {
    const token = request.cookies.get('admin-session')?.value;
    
    if (!token) {
      const loginUrl = new URL('/adminko-login', request.url);
      loginUrl.searchParams.set('from', path);
      return NextResponse.redirect(loginUrl);
    }
    
    const session = await verifySession(token);
    
    if (!session) {
      const loginUrl = new URL('/adminko-login', request.url);
      loginUrl.searchParams.set('from', path);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/adminko/:path*'
};
