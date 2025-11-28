#!/usr/bin/env tsx

/**
 * Cron скрипт для пересчёта рейтинга статей
 * 
 * Запуск:
 *   npx tsx scripts/cron-rating.ts
 * 
 * Или через cron (каждый час):
 *   0 * * * * cd /path/to/mediasyndicate && npx tsx scripts/cron-rating.ts
 */

import { RatingService } from '../lib/services/RatingService';

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔄 CRON: Пересчёт рейтинга статей');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log(`Время запуска: ${new Date().toISOString()}`);
  console.log('');

  try {
    const result = await RatingService.recalculateAllRatings();
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ УСПЕХ');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log(`Обновлено статей: ${result.updated}`);
    console.log(`Ошибок: ${result.errors}`);
    console.log('');
    console.log(`Время завершения: ${new Date().toISOString()}`);
    
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('═══════════════════════════════════════════════════════════');
    console.error('❌ ОШИБКА');
    console.error('═══════════════════════════════════════════════════════════');
    console.error('');
    console.error(error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error('');
      console.error('Stack trace:');
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

main();

