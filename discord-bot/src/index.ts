import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import { config } from "./config.js";
import { runRoleSync } from "./role-sync.js";
import { initializeRoles } from "./role-init.js";

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

let syncTimer: NodeJS.Timeout | null = null;
let running = false;

/**
 * Safely runs role sync with error handling and concurrency protection
 */
async function runSyncSafely() {
    if (running) {
        console.log("[role-sync] previous run still in progress; skipping tick");
        return;
    }

    running = true;
    try {
        await runRoleSync(client as Client<true>);
    } catch (error) {
        console.error("[role-sync] unexpected top-level error:", error);
    } finally {
        running = false;
    }
}

/**
 * Gracefully shuts down the bot
 */
async function shutdown(signal: string) {
    console.log(`[bot] shutting down (${signal})`);
    if (syncTimer) {
        clearInterval(syncTimer);
        syncTimer = null;
    }
    try {
        await client.destroy();
    } catch (error) {
        console.error("[bot] error during shutdown:", error);
    }
    process.exit(0);
}

client.once("ready", async () => {
    console.log(`[bot] logged in as ${client.user?.tag}`);
    console.log(`[bot] sync interval ms=${config.syncIntervalMs}, windowDays=${config.windowDays}, dryRun=${config.dryRun}`);

    // Initialize roles first (create missing roles from DISCORD_ROLES env)
    const roleMap = await initializeRoles(client as Client<true>);
    if (roleMap.size > 0) {
        console.log("[bot] role IDs for configuration:");
        for (const [name, id] of roleMap) {
            console.log(`  - ${name}: ${id}`);
        }
    }

    await runSyncSafely();

    syncTimer = setInterval(() => {
        void runSyncSafely();
    }, config.syncIntervalMs);
});

client.on("error", (error) => {
    console.error("[bot] discord client error:", error);
});

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

process.on("unhandledRejection", (reason, promise) => {
    console.error("[bot] unhandled rejection at:", promise, "reason:", reason);
});

void client.login(config.discordToken);
