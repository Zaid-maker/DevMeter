import type { RoleRule } from "./types.js";

/**
 * Gets a required environment variable or throws an error
 * @param name - The environment variable name
 * @returns The environment variable value
 * @throws {Error} If the environment variable is not set
 */
function getRequiredEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

/**
 * Parses and validates the window days parameter
 * @param value - The raw string value
 * @returns A number between 1 and 90, defaulting to 7
 */
function parseWindowDays(value: string | undefined): number {
    if (!value) return 7;

    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return 7;

    return Math.max(1, Math.min(parsed, 90));
}

/**
 * Parses and validates the sync interval in milliseconds
 * @param value - The raw string value
 * @returns A number >= 30000, defaulting to 5 minutes
 */
function parseIntervalMs(value: string | undefined): number {
    if (!value) return 5 * 60 * 1000;

    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return 5 * 60 * 1000;

    return Math.max(30_000, parsed);
}

/**
 * Parses role rules from environment variable JSON
 * @param raw - The raw JSON string from DISCORD_ROLE_RULES env var
 * @returns Array of role rules, or null to indicate API fetch needed
 * @throws {Error} If JSON is malformed or rules are invalid
 */
function parseRoleRules(raw: string | undefined): RoleRule[] | null {
    if (!raw) {
        return null; // Return null to indicate rules should be fetched from API
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        throw new Error("DISCORD_ROLE_RULES must be valid JSON. Check for syntax errors.");
    }

    if (!Array.isArray(parsed)) {
        throw new Error("DISCORD_ROLE_RULES must be a JSON array.");
    }

    // Empty array means fetch from API (same as null)
    if (parsed.length === 0) {
        return null;
    }

    return parsed.map((item, index) => {
        if (!item || typeof item !== "object") {
            throw new Error(`Role rule at index ${index} must be an object.`);
        }

        const candidate = item as Record<string, unknown>;
        const name = candidate.name;
        const roleId = candidate.roleId;
        const priority = typeof candidate.priority === "number" ? candidate.priority : 0;

        if (typeof name !== "string" || !name.trim()) {
            throw new Error(`Role rule at index ${index} must include a non-empty string 'name'.`);
        }

        if (typeof roleId !== "string" || !roleId.trim()) {
            throw new Error(`Role rule at index ${index} must include a non-empty string 'roleId'.`);
        }

        return {
            name,
            roleId,
            priority,
            minHours: typeof candidate.minHours === "number" ? candidate.minHours : undefined,
            minXp: typeof candidate.minXp === "number" ? candidate.minXp : undefined,
            minLevel: typeof candidate.minLevel === "number" ? candidate.minLevel : undefined,
            minHeartbeats: typeof candidate.minHeartbeats === "number" ? candidate.minHeartbeats : undefined,
        } satisfies RoleRule;
    }).sort((a, b) => b.priority - a.priority);
}

/** Bot configuration loaded from environment variables */
export const config = {
    discordToken: getRequiredEnv("DISCORD_BOT_TOKEN"),
    guildId: getRequiredEnv("DISCORD_GUILD_ID"),
    // Must be a least-privilege credential used only for Discord sync endpoints.
    syncSecret: getRequiredEnv("DISCORD_SYNC_SECRET"),
    appUrl: getRequiredEnv("DEVMETER_APP_URL"),
    windowDays: parseWindowDays(process.env.DISCORD_SYNC_WINDOW_DAYS),
    syncIntervalMs: parseIntervalMs(process.env.DISCORD_SYNC_INTERVAL_MS),
    dryRun: process.env.DISCORD_DRY_RUN === "true",
    roleRules: parseRoleRules(process.env.DISCORD_ROLE_RULES),
} as const;

/**
 * Fetches role rules from API endpoint or returns env-configured rules
 * @returns Array of role rules for the configured guild
 * @throws {Error} If API request fails
 */
export async function fetchRoleRules(): Promise<RoleRule[]> {
    // If rules are configured in env, use them (for local testing)
    if (config.roleRules !== null) {
        console.log("[config] using role rules from DISCORD_ROLE_RULES env var");
        return config.roleRules;
    }

    // Otherwise fetch from API
    console.log("[config] fetching role rules from API");
    const endpoint = new URL("/api/discord/role-rules", config.appUrl);
    endpoint.searchParams.set("guildId", config.guildId);

    let response: Response;
    try {
        response = await fetch(endpoint, {
            headers: {
                "x-admin-secret": config.syncSecret,
            },
            signal: AbortSignal.timeout(10_000),
        });
    } catch (error) {
        const timedOut = error instanceof Error && error.name === "TimeoutError";
        if (timedOut) {
            throw new Error("Failed to fetch role rules: request timed out after 10s");
        }
        throw error;
    }

    if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(
            `Failed to fetch role rules: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ""}`
        );
    }

    const data = (await response.json()) as { rules: Array<{
        id: string;
        name: string;
        roleId: string;
        minHours: number | null;
        minXp: number | null;
        minLevel: number | null;
        minHeartbeats: number | null;
        priority: number;
    }> };

    return data.rules.map((rule) => ({
        name: rule.name,
        roleId: rule.roleId,
        priority: rule.priority,
        minHours: rule.minHours ?? undefined,
        minXp: rule.minXp ?? undefined,
        minLevel: rule.minLevel ?? undefined,
        minHeartbeats: rule.minHeartbeats ?? undefined,
    })).sort((a, b) => b.priority - a.priority);
}
