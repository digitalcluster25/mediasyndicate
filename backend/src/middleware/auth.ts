import jwt from 'jsonwebtoken';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'mediasyndicate-admin-secret-change-me';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

export function generateToken(): string {
  return jwt.sign({ role: 'admin' }, ADMIN_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): boolean {
  try {
    jwt.verify(token, ADMIN_SECRET);
    return true;
  } catch {
    return false;
  }
}

export function checkPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}
