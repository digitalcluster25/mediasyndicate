import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth/session';

export async function GET() {
  await clearSessionCookie();
  
  // Редирект на логин
  return NextResponse.redirect(
    new URL('/adminko', process.env.NEXT_PUBLIC_URL || 'http://localhost:3000')
  );
}

export async function POST() {
  await clearSessionCookie();
  
  return NextResponse.json({
    success: true,
    message: 'Logged out successfully'
  });
}
