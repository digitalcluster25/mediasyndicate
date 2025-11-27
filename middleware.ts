import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Пропустить логин
  if (path === '/adminko') {
    const response = NextResponse.next();
    
    // Установить правильные headers для админки
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  }
  
  // Для /adminko/* проверить cookie
  if (path.startsWith('/adminko/')) {
    const token = request.cookies.get('admin-session-v2')?.value || request.cookies.get('admin-session')?.value;
    
    if (!token) {
      const loginUrl = new URL('/adminko', request.url);
      loginUrl.searchParams.set('from', path);
      const response = NextResponse.redirect(loginUrl);
      
      // Установить no-cache headers
      response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
      
      return response;
    }
    
    // Cookie есть - пропустить с правильными headers
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/adminko/:path*'
};
