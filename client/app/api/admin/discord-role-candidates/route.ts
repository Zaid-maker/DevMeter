import { prisma } from "@/lib/prisma";
import { calculateDuration } from "@/lib/stats-utils";
import { subDays } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_SECRET = process.env.DEV_ADMIN_SECRET;

function getAdminSecret() {
    const isDev = process.env.NODE_ENV === "development";

    if (!ADMIN_SECRET) {
        if (isDev) return "dev-secret-123";
        throw new Error("DEV_ADMIN_SECRET is not configured in production environment.");
    }

    return ADMIN_SECRET;
}

function parseWindowDays(value: string | null) {
    if (!value) return 7;

    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return 7;

    return Math.max(1, Math.min(parsed, 90));
}

export async function GET(req: NextRequest) {
    const secret = req.headers.get("x-admin-secret");

    try {
        const activeSecret = getAdminSecret();
        if (secret !== activeSecret) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

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
