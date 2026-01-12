import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { startOfDay, subDays, format } from "date-fns";
import { calculateDuration, calculateStreaks } from "@/lib/stats-utils";

export async function GET(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    let userId: string;

    if (session) {
        userId = session.user.id;
    } else {
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const apiKeyStr = authHeader.split(" ")[1];
        const apiKey = await prisma.apiKey.findUnique({
            where: { key: apiKeyStr },
        });

        if (!apiKey) {
            return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
        }

        userId = apiKey.userId;
    }

    // Unified validation for both auth paths
    const userItem = await prisma.user.findUnique({
        where: { id: userId },
        select: { deletedAt: true, timezone: true }
    });

    if (!userItem || userItem.deletedAt) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const timezone = userItem.timezone || "UTC";
    const now = new Date();
    const startDate = subDays(startOfDay(now), 365);

    try {
        const heartbeats = await prisma.heartbeat.findMany({
            where: {
                userId,
                timestamp: {
                    gte: startDate,
                },
            },
            orderBy: {
                timestamp: "asc",
            },
        });

        // Group by day
        const dailyHeartbeats: Record<string, typeof heartbeats> = {};
        heartbeats.forEach(h => {
            const dayStr = format(new Date(h.timestamp), "yyyy-MM-dd");
            if (!dailyHeartbeats[dayStr]) dailyHeartbeats[dayStr] = [];
            dailyHeartbeats[dayStr].push(h);
        });

        const contributionData = Object.entries(dailyHeartbeats).map(([date, hList]) => ({
            date,
            count: parseFloat(calculateDuration(hList).toFixed(2))
        }));

        // Streak calculation using centralized utility
        const activeDays = new Set(Object.keys(dailyHeartbeats));
        const { current: currentStreak, longest: longestStreak } = calculateStreaks(activeDays, timezone);

        const totalHours = contributionData.reduce((acc, curr) => acc + curr.count, 0);

        return NextResponse.json({
            contributions: contributionData,
            streaks: {
                current: currentStreak,
                longest: longestStreak
            },
            summary: {
                totalHours: parseFloat(totalHours.toFixed(1)),
                daysActive: activeDays.size,
                averagePerDay: activeDays.size > 0 ? parseFloat((totalHours / activeDays.size).toFixed(1)) : 0
            }
        });

    } catch (error) {
        console.error("Contribution API error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
