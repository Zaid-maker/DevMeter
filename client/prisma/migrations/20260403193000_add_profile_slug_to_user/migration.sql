-- Add optional vanity slug for public profiles
ALTER TABLE "User"
ADD COLUMN "profileSlug" TEXT;

-- Enforce uniqueness for non-null slugs
CREATE UNIQUE INDEX "User_profileSlug_key" ON "User"("profileSlug");
