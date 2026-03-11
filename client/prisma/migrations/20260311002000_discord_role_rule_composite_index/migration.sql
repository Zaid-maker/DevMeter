-- DropIndex
DROP INDEX IF EXISTS "DiscordRoleRule_enabled_idx";

-- CreateIndex
CREATE INDEX "DiscordRoleRule_guildId_enabled_idx" ON "DiscordRoleRule"("guildId", "enabled");
