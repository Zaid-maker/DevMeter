import type { RoleRule } from "./types.js";

function getRequiredEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

function parseWindowDays(value: string | undefined): number {
    if (!value) return 7;

    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return 7;

    return Math.max(1, Math.min(parsed, 90));
}

function parseIntervalMs(value: string | undefined): number {
    if (!value) return 5 * 60 * 1000;

    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return 5 * 60 * 1000;

    return Math.max(30_000, parsed);
}

function parseRoleRules(raw: string | undefined): RoleRule[] {
    if (!raw) {
        throw new Error("DISCORD_ROLE_RULES is required. Provide a JSON array of role rule objects.");
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        throw new Error("DISCORD_ROLE_RULES must be valid JSON.");
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("DISCORD_ROLE_RULES must be a non-empty JSON array.");
    }

    return parsed.map((item, index) => {
        if (!item || typeof item !== "object") {
            throw new Error(`Role rule at index ${index} must be an object.`);
        }

        const candidate = item as Record<string, unknown>;
        const name = candidate.name;
        const roleId = candidate.roleId;

        if (typeof name !== "string" || !name.trim()) {
            throw new Error(`Role rule at index ${index} must include a non-empty string 'name'.`);
        }

        if (typeof roleId !== "string" || !roleId.trim()) {
            throw new Error(`Role rule at index ${index} must include a non-empty string 'roleId'.`);
        }

        return {
            name,
            roleId,
            minHours: typeof candidate.minHours === "number" ? candidate.minHours : undefined,
            minXp: typeof candidate.minXp === "number" ? candidate.minXp : undefined,
            minLevel: typeof candidate.minLevel === "number" ? candidate.minLevel : undefined,
            minHeartbeats: typeof candidate.minHeartbeats === "number" ? candidate.minHeartbeats : undefined,
        } satisfies RoleRule;
    });
}

export const config = {
    discordToken: getRequiredEnv("DISCORD_BOT_TOKEN"),
    guildId: getRequiredEnv("DISCORD_GUILD_ID"),
    adminSecret: getRequiredEnv("DEV_ADMIN_SECRET"),
    appUrl: getRequiredEnv("DEVMETER_APP_URL"),
    windowDays: parseWindowDays(process.env.DISCORD_SYNC_WINDOW_DAYS),
    syncIntervalMs: parseIntervalMs(process.env.DISCORD_SYNC_INTERVAL_MS),
    dryRun: process.env.DISCORD_DRY_RUN === "true",
    roleRules: parseRoleRules(process.env.DISCORD_ROLE_RULES),
};
