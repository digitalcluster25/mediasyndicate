#!/usr/bin/env tsx

/**
 * Тест RSS Bridge для Telegram каналов
 * 
 * Использование:
 *   tsx scripts/test-telegram-rss-bridge.ts @uniannet
 *   tsx scripts/test-telegram-rss-bridge.ts https://t.me/uniannet
 *   tsx scripts/test-telegram-rss-bridge.ts uniannet
 */

import { TelegramParser } from '../lib/services/TelegramParser';

async function main() {
  const channelInput = process.argv[2];
  
  if (!channelInput) {
    console.error('❌ Укажи канал для теста:');
    console.error('   tsx scripts/test-telegram-rss-bridge.ts @uniannet');
    console.error('   tsx scripts/test-telegram-rss-bridge.ts https://t.me/uniannet');
    process.exit(1);
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 ТЕСТ RSS BRIDGE ДЛЯ TELEGRAM');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log(`Канал: ${channelInput}`);
  console.log('');

  try {
    // Нормализация
    const normalized = TelegramParser.normalizeChannelUsername(channelInput);
    console.log(`✅ Нормализовано: "${normalized}"`);
    console.log('');

    // Парсинг через RSS Bridge
    console.log('📡 Парсинг через RSS Bridge...');
    const feed = await TelegramParser.parse(channelInput);
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ РЕЗУЛЬТАТ');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log(`Название: ${feed.title}`);
    console.log(`Описание: ${feed.description || 'нет'}`);
    console.log(`Статей: ${feed.items.length}`);
    console.log('');

    if (feed.items.length > 0) {
      console.log('📰 Первые 5 статей:');
      console.log('');
      feed.items.slice(0, 5).forEach((item, index) => {
        console.log(`${index + 1}. ${item.title}`);
        console.log(`   Ссылка: ${item.link}`);
        console.log(`   Дата: ${item.pubDate.toISOString()}`);
        if (item.description) {
          const desc = item.description.length > 100 
            ? item.description.substring(0, 100) + '...'
            : item.description;
          console.log(`   Описание: ${desc}`);
        }
        console.log('');
      });
    } else {
      console.log('⚠️  Статей не найдено');
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ ТЕСТ ЗАВЕРШЕН');
    console.log('═══════════════════════════════════════════════════════════');
  } catch (error) {
    console.error('');
    console.error('═══════════════════════════════════════════════════════════');
    console.error('❌ ОШИБКА');
    console.error('═══════════════════════════════════════════════════════════');
    console.error('');
    console.error(error instanceof Error ? error.message : String(error));
    console.error('');
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();

