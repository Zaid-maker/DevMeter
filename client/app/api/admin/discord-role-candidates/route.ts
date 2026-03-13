import { prisma } from "@/lib/prisma";
import { calculateDuration } from "@/lib/stats-utils";
import { validateDiscordSyncAuth } from "@/lib/admin-auth";
import { subDays } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

const USER_BATCH_SIZE = 200;

const NO_STORE_HEADERS = {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
} as const;

function jsonNoStore(body: unknown, init?: ResponseInit) {
    return NextResponse.json(body, {
        ...init,
        headers: {
            ...NO_STORE_HEADERS,
            ...(init?.headers ?? {}),
        },
    });
}

/**
 * Parses and validates the windowDays query parameter
 * @param value - The raw query parameter value
 * @returns A number between 1 and 90, defaulting to 7
 */
function parseWindowDays(value: string | null) {
    if (!value) return 7;

    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return 7;

    return Math.max(1, Math.min(parsed, 90));
}

/**
 * GET /api/admin/discord-role-candidates
 * Fetches all Discord-linked users with their activity metrics
 * @param req - Request with x-admin-secret header and optional windowDays query param
 */
export async function GET(req: NextRequest) {
    // Enforce strict bot-scoped auth for this endpoint.
    if (!process.env.DISCORD_SYNC_SECRET) {
        return jsonNoStore({ error: "Server Misconfigured" }, { status: 500 });
    }

    const authError = validateDiscordSyncAuth(req);
    if (authError) {
        for (const [key, value] of Object.entries(NO_STORE_HEADERS)) {
            authError.headers.set(key, value);
        }
        return authError;
    }

    try {
        const windowDays = parseWindowDays(req.nextUrl.searchParams.get("windowDays"));
        const since = subDays(new Date(), windowDays);

        const candidates: Array<{
            userId: string;
            name: string | null;
            discordUserId: string | null;
            discordUsername: string | null;
            discordLinkedAt: Date | null;
            xp: number;
            level: number;
            heartbeatCount: number;
            totalHours: number;
        }> = [];

        let cursorId: string | undefined;

        while (true) {
            const users = await prisma.user.findMany({
                where: {
                    deletedAt: null,
                    emailVerified: true,
                    discordUserId: { not: null },
                },
                orderBy: { id: "asc" },
                take: USER_BATCH_SIZE,
                ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
                select: {
                    id: true,
                    name: true,
                    xp: true,
                    level: true,
                    discordUserId: true,
                    discordUsername: true,
                    discordLinkedAt: true,
                    heartbeats: {
                        where: {
                            timestamp: { gte: since },
                        },
                        select: {
                            timestamp: true,
                        },
                    },
                },
            });

            if (users.length === 0) {
                break;
            }

            for (const user of users) {
                const totalHours = calculateDuration(user.heartbeats);

                candidates.push({
                    userId: user.id,
                    name: user.name,
                    discordUserId: user.discordUserId,
                    discordUsername: user.discordUsername,
                    discordLinkedAt: user.discordLinkedAt,
                    xp: user.xp,
                    level: user.level,
                    heartbeatCount: user.heartbeats.length,
                    totalHours: Number(totalHours.toFixed(2)),
                });
            }

            cursorId = users[users.length - 1]?.id;
        }

        return jsonNoStore({
            meta: {
                windowDays,
                since,
                totalCandidates: candidates.length,
            },
            candidates,
        });
    } catch (error) {
        console.error("GET /api/admin/discord-role-candidates error:", error);
        return jsonNoStore({ error: "Internal Server Error" }, { status: 500 });
    }
}
