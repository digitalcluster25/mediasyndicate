import { prisma } from '../prisma';

export interface PromptVariables {
  [key: string]: string | number | boolean;
}

/**
 * Сервис для работы с промптами
 */
export class PromptService {
  /**
   * Получить промпт по ключу и подставить переменные
   */
  public static async getPrompt(
    key: string,
    variables?: PromptVariables
  ): Promise<string> {
    const prompt = await prisma.prompt.findUnique({
      where: { key, isActive: true }
    });

    if (!prompt) {
      throw new Error(`Prompt with key "${key}" not found or inactive`);
    }

    let content = prompt.content;

    // Подставляем переменные если они есть
    if (variables && Object.keys(variables).length > 0) {
      // Проверяем что все требуемые переменные предоставлены
      const requiredVars = prompt.variables as Record<string, string> || {};
      const missingVars: string[] = [];

      for (const varKey in requiredVars) {
        if (!(varKey in variables)) {
          missingVars.push(varKey);
        }
      }

      if (missingVars.length > 0) {
        throw new Error(
          `Missing required variables for prompt "${key}": ${missingVars.join(', ')}`
        );
      }

      // Заменяем {{variable}} на значения
      for (const [varKey, varValue] of Object.entries(variables)) {
        const regex = new RegExp(`\\{\\{${varKey}\\}\\}`, 'g');
        content = content.replace(regex, String(varValue));
      }
    }

    return content;
  }

  /**
   * Получить промпт с метаданными
   */
  public static async getPromptWithMeta(key: string) {
    const prompt = await prisma.prompt.findUnique({
      where: { key, isActive: true }
    });

    if (!prompt) {
      throw new Error(`Prompt with key "${key}" not found or inactive`);
    }

    return prompt;
  }

  /**
   * Получить все активные промпты
   */
  public static async getAllActivePrompts() {
    return prisma.prompt.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Проверить существование промпта
   */
  public static async promptExists(key: string): Promise<boolean> {
    const count = await prisma.prompt.count({
      where: { key, isActive: true }
    });
    return count > 0;
  }
}


