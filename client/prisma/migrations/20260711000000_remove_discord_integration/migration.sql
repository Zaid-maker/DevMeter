-- DropForeignKey
ALTER TABLE "DiscordRoleSync" DROP CONSTRAINT IF EXISTS "DiscordRoleSync_userId_fkey";

-- DropTable
DROP TABLE IF EXISTS "DiscordRoleSync";

-- DropTable
DROP TABLE IF EXISTS "DiscordRoleRule";

-- DropIndex
DROP INDEX IF EXISTS "User_discordUserId_key";

-- AlterTable
ALTER TABLE "User"
DROP COLUMN IF EXISTS "discordUserId",
DROP COLUMN IF EXISTS "discordUsername",
DROP COLUMN IF EXISTS "discordLinkedAt",
DROP COLUMN IF EXISTS "discordJoinStatus";
