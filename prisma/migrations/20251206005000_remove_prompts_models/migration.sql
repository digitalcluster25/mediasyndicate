-- Remove Prompt and PromptHistory models

-- Drop foreign key constraint
ALTER TABLE "PromptHistory" DROP CONSTRAINT IF EXISTS "PromptHistory_promptId_fkey";

-- Drop indexes
DROP INDEX IF EXISTS "PromptHistory_promptId_idx";
DROP INDEX IF EXISTS "PromptHistory_createdAt_idx";
DROP INDEX IF EXISTS "Prompt_key_key";
DROP INDEX IF EXISTS "Prompt_key_idx";
DROP INDEX IF EXISTS "Prompt_isActive_idx";

-- Drop tables
DROP TABLE IF EXISTS "PromptHistory";
DROP TABLE IF EXISTS "Prompt";

