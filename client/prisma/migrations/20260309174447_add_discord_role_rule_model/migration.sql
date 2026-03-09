-- CreateTable
CREATE TABLE "DiscordRoleRule" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "minHours" DOUBLE PRECISION,
    "minXp" INTEGER,
    "minLevel" INTEGER,
    "minHeartbeats" INTEGER,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscordRoleRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DiscordRoleRule_guildId_idx" ON "DiscordRoleRule"("guildId");

-- CreateIndex
CREATE INDEX "DiscordRoleRule_enabled_idx" ON "DiscordRoleRule"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "DiscordRoleRule_guildId_roleId_key" ON "DiscordRoleRule"("guildId", "roleId");
