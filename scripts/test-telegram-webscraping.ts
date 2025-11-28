/**
 * Тестовый скрипт для проверки web scraping Telegram каналов
 * 
 * Использование:
 *   npx tsx scripts/test-telegram-webscraping.ts
 */

import { TelegramParser } from '../lib/services/TelegramParser';

async function testWebScraping() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 ТЕСТ TELEGRAM WEB SCRAPING');
  console.log('═══════════════════════════════════════════════════════════\n');

  const testChannel = '@uniannet';
  
  console.log(`Тестирую канал: ${testChannel}\n`);

  try {
    console.log('1. Тест normalizeChannelUsername...');
    // Тест через parse() который использует normalizeChannelUsername
    const result = await TelegramParser.parse(testChannel);
    
    console.log('✅ Парсинг успешен:');
    console.log(`   Название канала: ${result.title}`);
    console.log(`   Найдено постов: ${result.items.length}`);
    
    if (result.items.length > 0) {
      console.log('\n   Примеры постов:');
      result.items.slice(0, 3).forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.title.substring(0, 60)}...`);
        console.log(`      Ссылка: ${item.link}`);
        console.log(`      Дата: ${item.pubDate}`);
      });
    } else {
      console.log('\n   ⚠️ Постов не найдено');
      console.log('   Возможные причины:');
      console.log('   - Канал не публичный');
      console.log('   - Проблема с парсингом HTML');
      console.log('   - Изменилась структура страницы Telegram');
    }
    
    console.log('\n✅ Тестирование завершено');
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

testWebScraping().catch((error) => {
  console.error('❌ Критическая ошибка:', error);
  process.exit(1);
});

