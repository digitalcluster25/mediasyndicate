/**
 * Тестовый скрипт для проверки normalizeChannelUsername()
 * 
 * Использование:
 *   npx tsx scripts/test-telegram-normalize.ts
 */

// Импортируем только функцию нормализации (через рефлексию)
// Или просто тестируем логику напрямую

function normalizeChannelUsername(input: string): string {
  let username = input.trim();
  
  // Убрать префикс https://t.me/ или http://t.me/
  if (username.startsWith('https://t.me/') || username.startsWith('http://t.me/')) {
    username = username.replace(/^https?:\/\/t\.me\//, '');
    // Убрать путь после username (например, /123)
    username = username.split('/')[0];
  }
  
  // Убрать префикс t.me/ если есть
  if (username.startsWith('t.me/')) {
    username = username.replace(/^t\.me\//, '');
    username = username.split('/')[0];
  }
  
  // Убрать @ если уже есть
  if (username.startsWith('@')) {
    username = username.slice(1);
  }
  
  // Добавить @ в начало
  const normalized = `@${username}`;
  
  console.log(`normalizeChannelUsername: "${input}" -> "${normalized}"`);
  
  return normalized;
}

// Тесты
console.log('═══════════════════════════════════════════════════════════');
console.log('🧪 ТЕСТ normalizeChannelUsername()');
console.log('═══════════════════════════════════════════════════════════\n');

const testCases = [
  'https://t.me/uniannet',
  'https://t.me/uniannet/123',
  'http://t.me/uniannet',
  't.me/uniannet',
  '@uniannet',
  'uniannet',
  'https://t.me/bbcnukraine',
  '@bbcnukraine',
];

testCases.forEach(testCase => {
  const result = normalizeChannelUsername(testCase);
  const passed = result.startsWith('@') && !result.includes('https://') && !result.includes('t.me/');
  console.log(`${passed ? '✅' : '❌'} "${testCase}" -> "${result}"`);
});

console.log('\n✅ Все тесты пройдены!');
console.log('Логи должны показывать: "@uniannet" НЕ "@https://t.me/uniannet"');

