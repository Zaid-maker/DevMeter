import type { Client } from "discord.js";
import { config } from "./config.js";

export interface RoleDefinition {
    name: string;
    color?: string; // Hex color like "#CD7F32"
    hoist?: boolean; // Display separately in member list
    mentionable?: boolean;
}

/**
 * Parse role definitions from DISCORD_ROLES env var
 * Format: [{"name":"Bronze","color":"#CD7F32"},{"name":"Silver","color":"#C0C0C0"}]
 * @returns Array of validated role definitions
 */
function parseRoleDefinitions(): RoleDefinition[] {
    const raw = process.env.DISCORD_ROLES;
    if (!raw) {
        return [];
    }

    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            console.warn("[role-init] DISCORD_ROLES must be a JSON array; skipping role creation");
            return [];
        }

        return parsed.filter((item) => {
            if (!item || typeof item !== "object" || typeof item.name !== "string" || !item.name.trim()) {
                console.warn("[role-init] skipping invalid role definition:", item);
                return false;
            }
            return true;
        });
    } catch (error) {
        console.error("[role-init] failed to parse DISCORD_ROLES:", error);
        return [];
    }
}

/**
 * Parses a hex color string to a Discord-compatible integer
 * @param hexColor - Hex color string (e.g., "#CD7F32" or "CD7F32")
 * @returns Discord color integer or undefined if invalid
 */
function parseColor(hexColor: string): number | undefined {
    const cleaned = hexColor.replace("#", "");
    const parsed = parseInt(cleaned, 16);
    
    if (Number.isNaN(parsed) || cleaned.length !== 6) {
        console.warn(`[role-init] invalid color format: ${hexColor}`);
        return undefined;
    }
    
    return parsed;
}

/**
 * Initialize roles in the guild - create missing roles from DISCORD_ROLES env
 * Returns a map of role name -> role ID for created/existing roles
 * @param client - Authenticated Discord client
 * @returns Map of role name to role ID
 */
export async function initializeRoles(client: Client<true>): Promise<Map<string, string>> {
    const roleMap = new Map<string, string>();

    const definitions = parseRoleDefinitions();
    if (definitions.length === 0) {
        console.log("[role-init] no DISCORD_ROLES configured; skipping auto-creation");
        return roleMap;
    }

    console.log(`[role-init] processing ${definitions.length} role definitions`);

    try {
        const guild = await client.guilds.fetch(config.guildId);
        const existingRoles = await guild.roles.fetch();

        for (const def of definitions) {
            // Check if role already exists by name
            const existing = existingRoles.find(
                (role) => role.name.toLowerCase() === def.name.toLowerCase()
            );

            if (existing) {
                console.log(`[role-init] role "${def.name}" already exists (${existing.id})`);
                roleMap.set(def.name, existing.id);
                continue;
            }

            // Create the role
            try {
                const created = await guild.roles.create({
                    name: def.name,
                    color: def.color ? parseColor(def.color) : undefined,
                    hoist: def.hoist ?? false,
                    mentionable: def.mentionable ?? false,
                    reason: "DevMeter auto-role creation",
                });

                console.log(`[role-init] ✓ created role "${def.name}" (${created.id})`);
                roleMap.set(def.name, created.id);
            } catch (error) {
                console.error(`[role-init] ✗ failed to create role "${def.name}":`, error);
            }
        }

        console.log(`[role-init] initialization complete; ${roleMap.size}/${definitions.length} roles ready`);
    } catch (error) {
        console.error("[role-init] failed to initialize roles:", error);
    }

    return roleMap;
}
