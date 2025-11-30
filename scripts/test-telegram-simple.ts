#!/usr/bin/env tsx

/**
 * Тест простого парсера Telegram каналов
 * 
 * Использование:
 *   npx tsx scripts/test-telegram-simple.ts @uniannet
 *   npx tsx scripts/test-telegram-simple.ts https://t.me/uniannet
 *   npx tsx scripts/test-telegram-simple.ts uniannet
 */

import { TelegramParser } from '../lib/services/TelegramParser';

async function main() {
  const channelInput = process.argv[2];
  
  if (!channelInput) {
    console.error('❌ Укажи канал для теста:');
    console.error('   npx tsx scripts/test-telegram-simple.ts @uniannet');
    console.error('   npx tsx scripts/test-telegram-simple.ts https://t.me/uniannet');
    process.exit(1);
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 ТЕСТ ПРОСТОГО TELEGRAM ПАРСЕРА');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log(`Канал: ${channelInput}`);
  console.log('');

  try {
    // Нормализация
    const normalized = TelegramParser.normalizeChannelUsername(channelInput);
    console.log(`✅ Нормализовано: "${normalized}"`);
    console.log('');

    // Парсинг
    console.log('📡 Парсинг через прямой HTML парсинг...');
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

    if (feed.items.length === 0) {
      console.log('❌ Статей не найдено!');
      console.log('   Проверь что канал публичный и доступен');
      process.exit(1);
    }

    if (feed.items.length < 5) {
      console.log(`⚠️  Найдено только ${feed.items.length} статей (ожидалось 5+)`);
    } else {
      console.log(`✅ Найдено ${feed.items.length} статей (требовалось 5+)`);
    }

    console.log('');
    console.log('📰 Первые 5 статей:');
    console.log('');
    feed.items.slice(0, 5).forEach((item, index) => {
      console.log(`${index + 1}. ${item.title}`);
      console.log(`   Ссылка: ${item.link}`);
      console.log(`   Дата: ${item.pubDate.toISOString()}`);
      if (item.description) {
        const desc = item.description.length > 150 
          ? item.description.substring(0, 150) + '...'
          : item.description;
        console.log(`   Описание: ${desc}`);
      }
      console.log('');
    });

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ ТЕСТ ЗАВЕРШЕН');
    console.log('═══════════════════════════════════════════════════════════');
    
    if (feed.items.length >= 5) {
      console.log('');
      console.log('✅ УСПЕХ: Найдено 5+ постов!');
      process.exit(0);
    } else {
      console.log('');
      console.log('⚠️  ВНИМАНИЕ: Найдено меньше 5 постов');
      process.exit(1);
    }
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


