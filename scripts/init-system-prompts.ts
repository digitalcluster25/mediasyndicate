/**
 * Скрипт для инициализации системных промптов
 * Запуск: npx tsx scripts/init-system-prompts.ts
 */

import { createSystemPrompts } from '../lib/prompts/system-prompts';

async function main() {
  console.log('Initializing system prompts...');
  await createSystemPrompts();
  console.log('System prompts initialized successfully!');
  process.exit(0);
}

main().catch((error) => {
  console.error('Error initializing system prompts:', error);
  process.exit(1);
});

