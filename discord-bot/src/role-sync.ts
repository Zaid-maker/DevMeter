import { GuildMember, type Client } from "discord.js";
import { config } from "./config.js";
import type { CandidateResponse, RoleCandidate, RoleRule } from "./types.js";

function isEligible(candidate: RoleCandidate, rule: RoleRule): boolean {
    if (typeof rule.minHours === "number" && candidate.totalHours < rule.minHours) return false;
    if (typeof rule.minXp === "number" && candidate.xp < rule.minXp) return false;
    if (typeof rule.minLevel === "number" && candidate.level < rule.minLevel) return false;
    if (typeof rule.minHeartbeats === "number" && candidate.heartbeatCount < rule.minHeartbeats) return false;
    return true;
}

function getManagedRoleIds(): Set<string> {
    return new Set(config.roleRules.map((rule) => rule.roleId));
}

function getDesiredRoleIds(candidate: RoleCandidate): Set<string> {
    const desired = new Set<string>();

    for (const rule of config.roleRules) {
        if (isEligible(candidate, rule)) {
            desired.add(rule.roleId);
        }
    }

    return desired;
}

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

async function applyMemberRoles(member: GuildMember, candidate: RoleCandidate): Promise<{ added: string[]; removed: string[] }> {
    const managedRoleIds = getManagedRoleIds();
    const desiredRoleIds = getDesiredRoleIds(candidate);

    const currentManagedRoles = new Set(
        member.roles.cache
            .map((role) => role.id)
            .filter((roleId) => managedRoleIds.has(roleId))
    );

    const rolesToAdd = [...desiredRoleIds].filter((roleId) => !currentManagedRoles.has(roleId));
    const rolesToRemove = [...currentManagedRoles].filter((roleId) => !desiredRoleIds.has(roleId));

    if (config.dryRun) {
        return { added: rolesToAdd, removed: rolesToRemove };
    }

    for (const roleId of rolesToAdd) {
        await member.roles.add(roleId, "DevMeter activity role sync");
    }

    for (const roleId of rolesToRemove) {
        await member.roles.remove(roleId, "DevMeter activity role sync");
    }

    return { added: rolesToAdd, removed: rolesToRemove };
}

export async function runRoleSync(client: Client<true>): Promise<void> {
    const guild = await client.guilds.fetch(config.guildId);

    const payload = await fetchCandidates();
    const candidates = payload.candidates.filter((c) => Boolean(c.discordUserId));

    let processed = 0;
    let skipped = 0;
    let failures = 0;

    for (const candidate of candidates) {
        try {
            const member = await guild.members.fetch(candidate.discordUserId);
            const result = await applyMemberRoles(member, candidate);

            processed += 1;
            console.log(
                `[role-sync] ${candidate.discordUserId} processed; added=${result.added.length} removed=${result.removed.length}`
            );
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

    console.log(
        `[role-sync] completed candidates=${candidates.length} processed=${processed} skipped=${skipped} failures=${failures} windowDays=${payload.meta.windowDays}`
    );
}
