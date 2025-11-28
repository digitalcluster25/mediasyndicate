/**
 * Тестовый скрипт для проверки TELEGRAM_BOT_TOKEN
 * 
 * Использование:
 *   npx tsx scripts/test-telegram-token.ts
 * 
 * Или с указанием токена:
 *   TELEGRAM_BOT_TOKEN=your_token npx tsx scripts/test-telegram-token.ts
 */

import { TelegramParser } from '../lib/services/TelegramParser';

async function testTelegramToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!token) {
    console.error('❌ TELEGRAM_BOT_TOKEN не найден в environment variables');
    console.log('\nДобавь токен:');
    console.log('  export TELEGRAM_BOT_TOKEN=your_token');
    console.log('  или добавь в .env.local');
    process.exit(1);
  }

  console.log('✅ TELEGRAM_BOT_TOKEN найден');
  console.log(`   Токен: ${token.substring(0, 10)}...${token.substring(token.length - 5)}\n`);

  // Тест 1: Получить информацию о канале
  console.log('📡 Тест 1: Получение информации о канале @uniannet...');
  try {
    const channelInfo = await TelegramParser.getChannelInfo('@uniannet');
    console.log('✅ Информация о канале получена:');
    console.log(`   Название: ${channelInfo.title}`);
    console.log(`   Username: ${channelInfo.username || 'N/A'}`);
    console.log(`   Описание: ${channelInfo.description || 'N/A'}\n`);
  } catch (error) {
    console.error('❌ Ошибка получения информации о канале:');
    console.error(`   ${error instanceof Error ? error.message : String(error)}\n`);
  }

  // Тест 2: Парсинг канала
  console.log('📡 Тест 2: Парсинг постов из канала @uniannet...');
  try {
    const result = await TelegramParser.parse('@uniannet');
    console.log('✅ Парсинг успешен:');
    console.log(`   Название канала: ${result.title}`);
    console.log(`   Найдено постов: ${result.items.length}`);
    
    if (result.items.length > 0) {
      console.log('\n   Пример поста:');
      const firstPost = result.items[0];
      console.log(`   - Заголовок: ${firstPost.title.substring(0, 50)}...`);
      console.log(`   - Ссылка: ${firstPost.link}`);
      console.log(`   - Дата: ${firstPost.pubDate}`);
    } else {
      console.log('\n   ⚠️ Постов не найдено');
      console.log('   Возможные причины:');
      console.log('   - Бот не подписан на канал');
      console.log('   - В канале нет новых сообщений после подписки бота');
      console.log('   - Telegram Bot API не возвращает историю, только новые сообщения');
    }
  } catch (error) {
    console.error('❌ Ошибка парсинга канала:');
    console.error(`   ${error instanceof Error ? error.message : String(error)}\n`);
  }

  console.log('\n✅ Тестирование завершено');
}

testTelegramToken().catch((error) => {
  console.error('❌ Критическая ошибка:', error);
  process.exit(1);
});

