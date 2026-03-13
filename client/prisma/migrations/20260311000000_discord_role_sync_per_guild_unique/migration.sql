-- DropIndex
DROP INDEX IF EXISTS "DiscordRoleSync_userId_key";

-- CreateIndex
CREATE UNIQUE INDEX "DiscordRoleSync_userId_guildId_key" ON "DiscordRoleSync"("userId", "guildId");
