import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { subDays } from "date-fns";
import { getLanguageIcon } from "@/lib/stats-service";
import { calculateDuration } from "@/lib/stats-utils";
import { redis } from "@/lib/redis";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const range = searchParams.get("range") || "7d"; // 7d, 30d, all

    const cacheKey = `leaderboard:range:${range}`;

    try {
        // 1. Try to get from cache
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
            return NextResponse.json(cachedData);
        }

        let startDate: Date | undefined;
        const now = new Date();

        if (range === "7d") {
            startDate = subDays(now, 7);
        } else if (range === "30d") {
            startDate = subDays(now, 30);
        } else if (range === "all") {
            startDate = undefined;
        }

        // 2. Fetch from DB if cache miss
        const users = await prisma.user.findMany({
            where: {
                deletedAt: null,
            },
            select: {
                id: true,
                name: true,
                image: true,
                heartbeats: {
                    where: startDate ? {
                        timestamp: {
                            gte: startDate,
                        },
                    } : {},
                    select: {
                        timestamp: true,
                        language: true,
                    },
                },
            },
        });

        const leaderboard = users.map(user => {
            const duration = calculateDuration(user.heartbeats);

            // Find top language
            const langCounts = new Map<string, number>();
            user.heartbeats.forEach(h => {
                langCounts.set(h.language, (langCounts.get(h.language) || 0) + 1);
            });

            let topLanguage = "None";
            let maxCount = 0;
            langCounts.forEach((count, lang) => {
                if (count > maxCount) {
                    maxCount = count;
                    topLanguage = lang;
                }
            });

            return {
                id: user.id,
                name: user.name || "Anonymous",
                image: user.image,
                totalHours: parseFloat(duration.toFixed(1)),
                topLanguage: {
                    name: topLanguage,
                    icon: topLanguage !== "None" ? getLanguageIcon(topLanguage) : null
                }
            };
        })
            .filter(item => item.totalHours > 0)
            .sort((a, b) => b.totalHours - a.totalHours);

        const responseData = { leaderboard };

        // 3. Store in cache for 10 minutes (600 seconds)
        await redis.set(cacheKey, responseData, { ex: 600 });

        return NextResponse.json(responseData);
    } catch (error) {
        console.error("Leaderboard API error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
