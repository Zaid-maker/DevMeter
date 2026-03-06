export interface RoleRule {
    name: string;
    roleId: string;
    minHours?: number;
    minXp?: number;
    minLevel?: number;
    minHeartbeats?: number;
}

export interface RoleCandidate {
    userId: string;
    email: string;
    name: string | null;
    discordUserId: string;
    discordUsername: string | null;
    discordLinkedAt: string | null;
    xp: number;
    level: number;
    heartbeatCount: number;
    totalHours: number;
}

export interface CandidateResponse {
    meta: {
        windowDays: number;
        since: string;
        totalCandidates: number;
    };
    candidates: RoleCandidate[];
}
