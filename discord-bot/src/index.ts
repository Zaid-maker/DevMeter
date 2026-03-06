import { Client, GatewayIntentBits } from "discord.js";
import { config } from "./config.js";
import { runRoleSync } from "./role-sync.js";

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

let syncTimer: NodeJS.Timeout | null = null;
let running = false;

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

client.once("ready", async () => {
    console.log(`[bot] logged in as ${client.user?.tag}`);
    console.log(`[bot] sync interval ms=${config.syncIntervalMs}, windowDays=${config.windowDays}, dryRun=${config.dryRun}`);

    await runSyncSafely();

    syncTimer = setInterval(() => {
        void runSyncSafely();
    }, config.syncIntervalMs);
});

process.on("SIGINT", async () => {
    console.log("[bot] shutting down");
    if (syncTimer) clearInterval(syncTimer);
    await client.destroy();
    process.exit(0);
});

process.on("SIGTERM", async () => {
    console.log("[bot] shutting down");
    if (syncTimer) clearInterval(syncTimer);
    await client.destroy();
    process.exit(0);
});

void client.login(config.discordToken);
