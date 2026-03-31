import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { NextRequest, NextResponse } from "next/server";

// The heartbeat endpoint is consumed by the VS Code extension which may run in
// a browser context (VS Code Web, code-server). Allow all origins because every
// request is authenticated via a per-user Bearer API key.
const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
    }

    const apiKeyStr = authHeader.split(" ")[1];

    try {
        // Find the API key and associated user with caching
        const cacheKey = `apikey:${apiKeyStr}`;
        let apiKey = await redis.get(cacheKey) as any;

        if (!apiKey) {
            apiKey = await prisma.apiKey.findUnique({
                where: { key: apiKeyStr },
                include: { user: { select: { id: true, deletedAt: true, xp: true, level: true } } }
            });

            if (!apiKey) {
                console.error(`Invalid API Key attempt: ${apiKeyStr.substring(0, 8)}...`);
                return NextResponse.json({ error: "Invalid API Key" }, { status: 401, headers: CORS_HEADERS });
            }

            // Cache for 24 hours
            await redis.set(cacheKey, apiKey, { ex: 86400 });
        }

        // Check if user is soft deleted
        if (apiKey.user.deletedAt) {
            console.warn(`Heartbeat rejected for deleted user: ${apiKey.userId}`);
            return NextResponse.json({ error: "User account is deleted" }, { status: 401, headers: CORS_HEADERS });
        }

        const body = await req.json();
        const { project, language, file, type, is_save, timestamp, editor, platform } = body;

        // Record the heartbeat - Core Path
        await prisma.heartbeat.create({
            data: {
                userId: apiKey.userId,
                project: project || "Unknown",
                language: language || "unknown",
                file: file || "unknown",
                type: type || "file",
                isSave: is_save || false,
                editor: editor || null,
                platform: platform || null,
                timestamp: new Date(timestamp || Date.now()),
            }
        });

        // BACKGROUND PROCESSING: Award XP, check levels, and achievements
        // We don't await this to keep the API response near-instant.
        (async () => {
            try {
                const XP_PER_HEARTBEAT = 10;
                const updatedUser = await prisma.user.update({
                    where: { id: apiKey.userId },
                    data: {
                        xp: { increment: XP_PER_HEARTBEAT }
                    }
                });

                const { getLevelFromXP } = await import("@/lib/gamification");
                const newLevel = getLevelFromXP(updatedUser.xp);

                if (newLevel > updatedUser.level) {
                    await prisma.user.update({
                        where: { id: apiKey.userId },
                        data: { level: newLevel }
                    });
                    console.log(`User ${apiKey.userId} leveled up to ${newLevel}!`);
                }

                // --- Background Achievement Logic ---
                const userAchievements = await prisma.userAchievement.findMany({
                    where: { userId: apiKey.userId },
                    select: { achievement: { select: { slug: true } } }
                });
                const unlockedSlugs = new Set(userAchievements.map(ua => ua.achievement.slug));

                const checkAndUnlock = async (slug: string) => {
                    if (unlockedSlugs.has(slug)) return;
                    const achievement = await prisma.achievement.findUnique({ where: { slug } });
                    if (!achievement) return;

                    try {
                        await prisma.userAchievement.create({
                            data: { userId: apiKey.userId, achievementId: achievement.id }
                        });
                    } catch (e: any) {
                        // P2002 = unique constraint violation — another concurrent heartbeat already unlocked this
                        if (e?.code === 'P2002') {
                            console.log(`Duplicate achievement ignored: ${slug} for user ${apiKey.userId}`);
                            return;
                        }
                        throw e; // Re-throw unexpected errors
                    }

                    if (achievement.xpReward > 0) {
                        const afterXPUser = await prisma.user.update({
                            where: { id: apiKey.userId },
                            data: { xp: { increment: achievement.xpReward } }
                        });
                        const finalLevel = getLevelFromXP(afterXPUser.xp);
                        if (finalLevel > afterXPUser.level) {
                            await prisma.user.update({
                                where: { id: apiKey.userId },
                                data: { level: finalLevel }
                            });
                        }
                    }
                };

                await checkAndUnlock('first-heartbeat');

                // Expensive checks only run in background
                const heartbeatCount = await prisma.heartbeat.count({ where: { userId: apiKey.userId } });
                if (heartbeatCount >= 30) await checkAndUnlock('hour-1');

                const languagesCount = await prisma.heartbeat.groupBy({
                    by: ['language'],
                    where: { userId: apiKey.userId }
                });
                if (languagesCount.length >= 3) await checkAndUnlock('languages-3');

                // --- Cache Invalidation ---
                // Invalidate user stats and contribution caches to ensure the dashboard reflects fresh data
                const ranges = ["today", "all", "yesterday", "default"];
                const keysToDelete = [
                    `contributions:${apiKey.userId}`,
                    ...ranges.map(r => `stats:${apiKey.userId}:${r}`)
                ];

                await redis.del(...keysToDelete);
                console.log(`Cache invalidated for user ${apiKey.userId}`);

            } catch (err) {
                console.error("Background gamification/cache error:", err);
            }
        })();

        return NextResponse.json({ status: "ok" }, { headers: CORS_HEADERS });
    } catch (error: any) {
        console.error("Heartbeat error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: CORS_HEADERS });
    }
}

export async function GET() {
    return NextResponse.json({
        status: "alive",
        message: "DevMeter Heartbeat API is reachable. Use POST to record activity."
    }, { headers: CORS_HEADERS });
}
