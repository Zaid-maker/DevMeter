import { GuildMember, type Client } from "discord.js";
import { config, fetchRoleRules } from "./config.js";
import type { CandidateResponse, RoleCandidate, RoleRule } from "./types.js";

/**
 * Checks if a candidate meets the eligibility criteria for a role
 * @param candidate - The user candidate to evaluate
 * @param rule - The role rule with criteria
 * @returns True if candidate meets all defined criteria
 */
function isEligible(candidate: RoleCandidate, rule: RoleRule): boolean {
    if (typeof rule.minHours === "number" && candidate.totalHours < rule.minHours) return false;
    if (typeof rule.minXp === "number" && candidate.xp < rule.minXp) return false;
    if (typeof rule.minLevel === "number" && candidate.level < rule.minLevel) return false;
    if (typeof rule.minHeartbeats === "number" && candidate.heartbeatCount < rule.minHeartbeats) return false;
    return true;
}

/**
 * Extracts role IDs from all rules that this bot manages
 * @param rules - Array of role rules
 * @returns Set of role IDs that bot is responsible for
 */
function getManagedRoleIds(rules: RoleRule[]): Set<string> {
    return new Set(rules.map((rule) => rule.roleId));
}

/**
 * Determines which roles a candidate should have based on eligibility
 * @param candidate - The user candidate to evaluate
 * @param rules - Array of role rules to check against
 * @returns Set of role IDs the candidate is eligible for
 */
function getDesiredRoleIds(candidate: RoleCandidate, rules: RoleRule[]): Set<string> {
    const desired = new Set<string>();

    for (const rule of rules) {
        if (isEligible(candidate, rule)) {
            desired.add(rule.roleId);
        }
    }

    return desired;
}

/**
 * Fetches Discord-linked users with activity metrics from API
 * @returns Response with candidates and metadata
 */
async function fetchCandidates(): Promise<CandidateResponse> {
    const endpoint = new URL("/api/admin/discord-role-candidates", config.appUrl);
    endpoint.searchParams.set("windowDays", String(config.windowDays));

    const response = await fetch(endpoint, {
        headers: {
            "x-admin-secret": config.adminSecret,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch role candidates: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as CandidateResponse;
}

/**
 * Applies role changes to a guild member based on their activity
 * @param member - The Discord guild member to update
 * @param candidate - The candidate data with activity metrics
 * @param rules - Array of role rules to evaluate
 * @returns Object with arrays of added and removed role IDs
 */
async function applyMemberRoles(
    member: GuildMember,
    candidate: RoleCandidate,
    rules: RoleRule[]
): Promise<{ added: string[]; removed: string[] }> {
    const managedRoleIds = getManagedRoleIds(rules);
    const desiredRoleIds = getDesiredRoleIds(candidate, rules);

    const currentManagedRoles = new Set(
        member.roles.cache
            .map((role) => role.id)
            .filter((roleId) => managedRoleIds.has(roleId))
    );

    const rolesToAdd = [...desiredRoleIds].filter((roleId) => !currentManagedRoles.has(roleId));
    const rolesToRemove = [...currentManagedRoles].filter((roleId) => !desiredRoleIds.has(roleId));

    if (config.dryRun) {
        console.log(
            `[role-sync] [DRY-RUN] ${candidate.discordUserId} would add=${rolesToAdd.length} remove=${rolesToRemove.length}`
        );
        return { added: rolesToAdd, removed: rolesToRemove };
    }

    for (const roleId of rolesToAdd) {
        try {
            await member.roles.add(roleId, "DevMeter activity role sync");
        } catch (error) {
            console.error(`[role-sync] failed to add role ${roleId} to ${member.id}:`, error);
        }
    }

    for (const roleId of rolesToRemove) {
        try {
            await member.roles.remove(roleId, "DevMeter activity role sync");
        } catch (error) {
            console.error(`[role-sync] failed to remove role ${roleId} from ${member.id}:`, error);
        }
    }

    return { added: rolesToAdd, removed: rolesToRemove };
}

/**
 * Main role sync function - evaluates all Discord-linked users and updates their roles
 * @param client - Authenticated Discord client
 */
export async function runRoleSync(client: Client<true>): Promise<void> {
    const startTime = Date.now();
    console.log("[role-sync] starting sync cycle");

    const guild = await client.guilds.fetch(config.guildId);

    // Fetch fresh role rules from API or env
    const rules = await fetchRoleRules();

    if (rules.length === 0) {
        console.warn("[role-sync] no role rules configured; skipping sync");
        return;
    }

    console.log(`[role-sync] loaded ${rules.length} role rules`);

    const payload = await fetchCandidates();
    const candidates = payload.candidates.filter((c) => Boolean(c.discordUserId));

    let processed = 0;
    let skipped = 0;
    let failures = 0;

    for (const candidate of candidates) {
        try {
            const member = await guild.members.fetch(candidate.discordUserId);
            const result = await applyMemberRoles(member, candidate, rules);

            processed += 1;
            if (result.added.length > 0 || result.removed.length > 0) {
                console.log(
                    `[role-sync] ${candidate.discordUserId} updated; added=${result.added.length} removed=${result.removed.length}`
                );
            }
        } catch (error) {
            skipped += 1;

            const message = error instanceof Error ? error.message : "unknown error";
            if (message.includes("Unknown Member") || message.includes("10007")) {
                console.warn(`[role-sync] ${candidate.discordUserId} not in guild; skipping`);
                continue;
            }

            failures += 1;
            console.error(`[role-sync] ${candidate.discordUserId} failed:`, error);
        }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(
        `[role-sync] completed in ${duration}s: candidates=${candidates.length} processed=${processed} skipped=${skipped} failures=${failures} windowDays=${payload.meta.windowDays}`
    );
}
