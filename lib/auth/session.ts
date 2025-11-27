import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'mediasyndicate-secret-key-2024'
);

export interface SessionData {
  username: string;
  isAdmin: true;
  createdAt: number;
}

export async function createSession(username: string): Promise<string> {
  const token = await new SignJWT({ username, isAdmin: true, createdAt: Date.now() })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET_KEY);

  return token;
}

export async function verifySession(token: string): Promise<SessionData | null> {
  try {
    const verified = await jwtVerify(token, SECRET_KEY);
    const payload = verified.payload as unknown;
    if (payload && typeof payload === 'object' && 'username' in payload && 'isAdmin' in payload) {
      return payload as SessionData;
    }
    return null;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin-session')?.value;
  
  if (!token) return null;
  
  return verifySession(token);
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  
  cookieStore.set('admin-session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/'
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('admin-session');
}

