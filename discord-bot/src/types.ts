/**
 * Defines eligibility criteria for a Discord role
 */
export interface RoleRule {
    /** Display name of the role */
    name: string;
    /** Discord role ID (snowflake) */
    roleId: string;
    /** Rule precedence (higher number = higher priority) */
    priority: number;
    /** Minimum coding hours required (optional) */
    minHours?: number;
    /** Minimum XP points required (optional) */
    minXp?: number;
    /** Minimum user level required (optional) */
    minLevel?: number;
    /** Minimum heartbeat count required (optional) */
    minHeartbeats?: number;
}

/**
 * Represents a Discord-linked user with their activity metrics
 */
export interface RoleCandidate {
    /** User ID from DevMeter database */
    userId: string;
    /** User's display name (optional) */
    name: string | null;
    /** Discord user ID (snowflake) */
    discordUserId: string;
    /** Discord username (optional) */
    discordUsername: string | null;
    /** Timestamp when Discord account was linked (optional) */
    discordLinkedAt: string | null;
    /** User's total XP points */
    xp: number;
    /** User's current level */
    level: number;
    /** Number of heartbeats in the evaluation window */
    heartbeatCount: number;
    /** Total hours of coding activity in the evaluation window */
    totalHours: number;
}

/**
 * Response from the role candidates API endpoint
 */
export interface CandidateResponse {
    /** Metadata about the query */
    meta: {
        /** Number of days in the evaluation window */
        windowDays: number;
        /** Start date of the evaluation window (ISO string) */
        since: string;
        /** Total number of candidates returned */
        totalCandidates: number;
    };
    /** Array of candidate users */
    candidates: RoleCandidate[];
}
