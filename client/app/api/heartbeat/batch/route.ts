import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { NextRequest, NextResponse } from "next/server";

// The batch heartbeat endpoint is consumed by the VS Code extension when the
// 24-hour sync window is enabled. Allow all origins because every request is
// authenticated via a per-user Bearer API key.
const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const MAX_BATCH_SIZE = 1000;
const API_KEY_CACHE_TTL = 86400; // 24 hours in seconds
const XP_PER_HEARTBEAT = 10;

interface IncomingHeartbeat {
    heartbeatId?: string; // Client-generated unique ID for deduplication
    project?: string;
    language?: string;
    file?: string;
    type?: string;
    is_save?: boolean;
    timestamp?: number;
    editor?: string;
    platform?: string;
}

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
        // Resolve and cache the API key (store only userId mapping, not full user data)
        const cacheKey = `apikey:${apiKeyStr}`;
        let cachedData = await redis.get(cacheKey);
        let userId: string;

        if (cachedData && typeof cachedData === 'object' && 'userId' in cachedData) {
            // Validate cached shape has userId
            userId = (cachedData as { userId: string }).userId;
        } else {
            // Cache miss: resolve from DB
            const apiKey = await prisma.apiKey.findUnique({
                where: { key: apiKeyStr },
                select: { userId: true }
            });

            if (!apiKey) {
                return NextResponse.json({ error: "Invalid API Key" }, { status: 401, headers: CORS_HEADERS });
            }

            userId = apiKey.userId;

            // Cache only the userId mapping for 24 hours
            await redis.set(cacheKey, { userId }, { ex: API_KEY_CACHE_TTL });
        }

        // Always check user soft-delete status fresh from DB (not cached)
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { deletedAt: true }
        });

        if (!user || user.deletedAt) {
            return NextResponse.json({ error: "User account is deleted" }, { status: 401, headers: CORS_HEADERS });
        }

        const body = await req.json();
        const { heartbeats } = body as { heartbeats: IncomingHeartbeat[] };

        if (!Array.isArray(heartbeats) || heartbeats.length === 0) {
            return NextResponse.json(
                { error: "Request body must contain a non-empty 'heartbeats' array" },
                { status: 400, headers: CORS_HEADERS }
            );
        }

        if (heartbeats.length > MAX_BATCH_SIZE) {
            return NextResponse.json(
                { error: `Batch size exceeds the maximum limit of ${MAX_BATCH_SIZE}` },
                { status: 400, headers: CORS_HEADERS }
            );
        }

        // Insert all heartbeats in a single transaction for atomicity
        // Use skipDuplicates to prevent double-inserts on client retries
        await prisma.heartbeat.createMany({
            data: heartbeats.map((h: IncomingHeartbeat) => ({
                heartbeatId: h.heartbeatId || null, // Client-generated unique ID for deduplication
                userId: userId,
                project: h.project || "Unknown",
                language: h.language || "unknown",
                file: h.file || "unknown",
                type: h.type || "file",
                isSave: h.is_save || false,
                editor: h.editor || null,
                platform: h.platform || null,
                timestamp: new Date(h.timestamp || Date.now()),
            })),
            skipDuplicates: true, // Ignore duplicates based on unique heartbeatId
        });

        // BACKGROUND PROCESSING: Award XP for the batch, check levels and achievements.
        // We don't await this to keep the API response near-instant.
        (async () => {
            try {
                const totalXp = heartbeats.length * XP_PER_HEARTBEAT;

                const updatedUser = await prisma.user.update({
                    where: { id: userId },
                    data: { xp: { increment: totalXp } }
                });

                const { getLevelFromXP } = await import("@/lib/gamification");
                const newLevel = getLevelFromXP(updatedUser.xp);

                if (newLevel > updatedUser.level) {
                    await prisma.user.update({
                        where: { id: userId },
                        data: { level: newLevel }
                    });
                    console.log(`User ${userId} leveled up to ${newLevel}!`);
                }

                // --- Background Achievement Logic ---
                const userAchievements = await prisma.userAchievement.findMany({
                    where: { userId: userId },
                    select: { achievement: { select: { slug: true } } }
                });
                const unlockedSlugs = new Set(userAchievements.map(ua => ua.achievement.slug));

                const checkAndUnlock = async (slug: string) => {
                    if (unlockedSlugs.has(slug)) return;
                    const achievement = await prisma.achievement.findUnique({ where: { slug } });
                    if (!achievement) return;

                    try {
                        await prisma.userAchievement.create({
                            data: { userId: userId, achievementId: achievement.id }
                        });
                    } catch (e: any) {
                        if (e?.code === 'P2002') return; // Already unlocked concurrently
                        throw e;
                    }

                    if (achievement.xpReward > 0) {
                        const afterXPUser = await prisma.user.update({
                            where: { id: userId },
                            data: { xp: { increment: achievement.xpReward } }
                        });
                        const finalLevel = getLevelFromXP(afterXPUser.xp);
                        if (finalLevel > afterXPUser.level) {
                            await prisma.user.update({
                                where: { id: userId },
                                data: { level: finalLevel }
                            });
                        }
                    }
                };

                await checkAndUnlock('first-heartbeat');

                const heartbeatCount = await prisma.heartbeat.count({ where: { userId: userId } });
                if (heartbeatCount >= 30) await checkAndUnlock('hour-1');

                const languagesCount = await prisma.heartbeat.groupBy({
                    by: ['language'],
                    where: { userId: userId }
                });
                if (languagesCount.length >= 3) await checkAndUnlock('languages-3');

                // --- Cache Invalidation ---
                const ranges = ["today", "all", "yesterday", "default"];
                const keysToDelete = [
                    `contributions:${userId}`,
                    ...ranges.map(r => `stats:${userId}:${r}`)
                ];
                await redis.del(...keysToDelete);
                console.log(`Cache invalidated for user ${userId} after batch sync`);

            } catch (err) {
                console.error("Batch background gamification/cache error:", err);
            }
        })();

        return NextResponse.json(
            { status: "ok", synced: heartbeats.length },
            { headers: CORS_HEADERS }
        );
    } catch (error: any) {
        console.error("Batch heartbeat error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500, headers: CORS_HEADERS }
        );
    }
}