import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { startOfDay, subDays, format, differenceInDays, isSameDay } from "date-fns";

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
        select: { deletedAt: true }
    });

    if (!userItem || userItem.deletedAt) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

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

        const contributions: Record<string, number> = {};

        // Helper function to calculate duration (reused logic)
        const calculateDuration = (hList: typeof heartbeats) => {
            if (hList.length === 0) return 0;

            let totalSeconds = 0;
            const SESSION_GAP = 15 * 60 * 1000;
            const HEARTBEAT_VAL = 2 * 60 * 1000;

            let lastTime = new Date(hList[0].timestamp).getTime();
            totalSeconds += HEARTBEAT_VAL / 1000;

            for (let i = 1; i < hList.length; i++) {
                const currentTime = new Date(hList[i].timestamp).getTime();
                const diff = currentTime - lastTime;

                if (diff < SESSION_GAP) {
                    totalSeconds += diff / 1000;
                } else {
                    totalSeconds += HEARTBEAT_VAL / 1000;
                }
                lastTime = currentTime;
            }

            return totalSeconds / 3600;
        };

        // Group by day
        const dailyHeartbeats: Record<string, typeof heartbeats> = {};
        heartbeats.forEach(h => {
            const dayStr = format(new Date(h.timestamp), "yyyy-MM-dd");
            if (!dailyHeartbeats[dayStr]) dailyHeartbeats[dayStr] = [];
            dailyHeartbeats[dayStr].push(h);
        });

        const contributionData = Object.entries(dailyHeartbeats).map(([date, hList]) => ({
            date,
            count: parseFloat(calculateDuration(hList).toFixed(2)) // We use hours as "count" for the heatmap
        }));

        // Streak calculation
        const activeDays = new Set(Object.keys(dailyHeartbeats).sort());
        const sortedDays = Array.from(activeDays).sort();

        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;

        if (sortedDays.length > 0) {
            // Longest streak
            for (let i = 0; i < sortedDays.length; i++) {
                if (i === 0) {
                    tempStreak = 1;
                } else {
                    const prevDate = new Date(sortedDays[i - 1]);
                    const currDate = new Date(sortedDays[i]);
                    if (differenceInDays(currDate, prevDate) === 1) {
                        tempStreak++;
                    } else {
                        tempStreak = 1;
                    }
                }
                longestStreak = Math.max(longestStreak, tempStreak);
            }

            // Current streak
            const todayStr = format(now, "yyyy-MM-dd");
            const yesterdayStr = format(subDays(now, 1), "yyyy-MM-dd");

            if (activeDays.has(todayStr) || activeDays.has(yesterdayStr)) {
                let checkDate = activeDays.has(todayStr) ? now : subDays(now, 1);
                while (activeDays.has(format(checkDate, "yyyy-MM-dd"))) {
                    currentStreak++;
                    checkDate = subDays(checkDate, 1);
                }
            }
        }

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
