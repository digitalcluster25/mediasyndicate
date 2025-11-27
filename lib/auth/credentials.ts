// Credentials читаются из environment variables
export const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME || 'boss',
  password: process.env.ADMIN_PASSWORD || ''
};

// Предупреждение если переменные не заданы
if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
  console.warn('⚠️  ADMIN_USERNAME or ADMIN_PASSWORD not set in environment variables!');
  console.warn('⚠️  Admin login will not work without these variables.');
}
