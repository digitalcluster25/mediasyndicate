import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth/session';

export async function GET(request: Request) {
  await clearSessionCookie();
  const url = new URL(request.url);
  const baseUrl = url.origin;
  return NextResponse.redirect(new URL('/admin-login', baseUrl));
}

export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({
    success: true,
    message: 'Logged out successfully'
  });
}
