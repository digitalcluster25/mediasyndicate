-- AlterTable
ALTER TABLE "Article" ADD COLUMN "views" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "forwards" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "reactions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "replies" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "rating" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Article_rating_idx" ON "Article"("rating");

-- CreateIndex
CREATE INDEX "Article_publishedAt_rating_idx" ON "Article"("publishedAt", "rating");
