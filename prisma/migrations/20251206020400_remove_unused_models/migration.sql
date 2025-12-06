-- Remove unused Prompt and PromptHistory models
-- (This migration is a no-op if tables were already removed in previous migrations)

-- Drop foreign key constraint if exists
ALTER TABLE "PromptHistory" DROP CONSTRAINT IF EXISTS "PromptHistory_promptId_fkey";

-- Drop indexes if exist
DROP INDEX IF EXISTS "PromptHistory_promptId_idx";
DROP INDEX IF EXISTS "PromptHistory_createdAt_idx";
DROP INDEX IF EXISTS "Prompt_key_key";
DROP INDEX IF EXISTS "Prompt_key_idx";
DROP INDEX IF EXISTS "Prompt_isActive_idx";

-- Drop tables if exist
DROP TABLE IF EXISTS "PromptHistory";
DROP TABLE IF EXISTS "Prompt";

