import { prisma } from "@/lib/prisma";
import { calculateDuration } from "@/lib/stats-utils";
import { validateAdminAuth } from "@/lib/admin-auth";
import { subDays } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

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
    const authError = validateAdminAuth(req);
    if (authError) return authError;

    try {
        const windowDays = parseWindowDays(req.nextUrl.searchParams.get("windowDays"));
        const since = subDays(new Date(), windowDays);

        const users = await prisma.user.findMany({
            where: {
                deletedAt: null,
                emailVerified: true,
                discordUserId: { not: null },
            },
            select: {
                id: true,
                email: true,
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

        const candidates = users.map((user) => {
            const totalHours = calculateDuration(user.heartbeats);

            return {
                userId: user.id,
                email: user.email,
                name: user.name,
                discordUserId: user.discordUserId,
                discordUsername: user.discordUsername,
                discordLinkedAt: user.discordLinkedAt,
                xp: user.xp,
                level: user.level,
                heartbeatCount: user.heartbeats.length,
                totalHours: Number(totalHours.toFixed(2)),
            };
        });

        return NextResponse.json({
            meta: {
                windowDays,
                since,
                totalCandidates: candidates.length,
            },
            candidates,
        });
    } catch (error) {
        console.error("GET /api/admin/discord-role-candidates error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
