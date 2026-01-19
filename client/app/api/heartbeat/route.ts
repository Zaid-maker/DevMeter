import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKeyStr = authHeader.split(" ")[1];

    try {
        // Find the API key and associated user
        const apiKey = await prisma.apiKey.findUnique({
            where: { key: apiKeyStr },
            include: { user: true }
        });

        if (!apiKey) {
            console.error(`Invalid API Key attempt: ${apiKeyStr.substring(0, 8)}...`);
            return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
        }

        // Check if user is soft deleted
        if (apiKey.user.deletedAt) {
            console.warn(`Heartbeat rejected for deleted user: ${apiKey.userId}`);
            return NextResponse.json({ error: "User account is deleted" }, { status: 401 });
        }

        const body = await req.json();
        const { project, language, file, type, is_save, timestamp, editor, platform } = body;

        // Record the heartbeat
        console.log(`Recording heartbeat for user ${apiKey.userId}, project: ${project}, file: ${file}`);

        const heartbeat = await prisma.heartbeat.create({
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

        // Award XP and check for level up
        const XP_PER_HEARTBEAT = 10;
        const updatedUser = await prisma.user.update({
            where: { id: apiKey.userId },
            data: {
                xp: { increment: XP_PER_HEARTBEAT }
            }
        });

        // Simple level calculation (can be refined with gamification utility later)
        // For now, let's just use a simple floor(sqrt(xp/100)) or similar if we want logic here
        // But better to use the lib
        const { getLevelFromXP } = await import("@/lib/gamification");
        const newLevel = getLevelFromXP(updatedUser.xp);

        if (newLevel > updatedUser.level) {
            await prisma.user.update({
                where: { id: apiKey.userId },
                data: { level: newLevel }
            });
            console.log(`User ${apiKey.userId} leveled up to ${newLevel}!`);
        }

        // --- Achievement Logic ---
        const userAchievements = await prisma.userAchievement.findMany({
            where: { userId: apiKey.userId },
            select: { achievement: { select: { slug: true } } }
        });
        const unlockedSlugs = new Set(userAchievements.map(ua => ua.achievement.slug));

        const checkAndUnlock = async (slug: string) => {
            if (unlockedSlugs.has(slug)) return;

            const achievement = await prisma.achievement.findUnique({ where: { slug } });
            if (!achievement) return;

            await prisma.userAchievement.create({
                data: {
                    userId: apiKey.userId,
                    achievementId: achievement.id
                }
            });

            // Reward achievement XP
            if (achievement.xpReward > 0) {
                const afterXPUser = await prisma.user.update({
                    where: { id: apiKey.userId },
                    data: { xp: { increment: achievement.xpReward } }
                });

                // Check level up again after achievement reward
                const finalLevel = getLevelFromXP(afterXPUser.xp);
                if (finalLevel > afterXPUser.level) {
                    await prisma.user.update({
                        where: { id: apiKey.userId },
                        data: { level: finalLevel }
                    });
                }
            }

            console.log(`User ${apiKey.userId} unlocked achievement: ${slug}`);
        };

        // 1. "Initiated" - First heartbeat
        await checkAndUnlock('first-heartbeat');

        // 2. "Freshman" - 1 hour of coding (30 heartbeats of 2 mins each)
        // This is a simple check, could be more robust by counting actual heartbeat duration
        const heartbeatCount = await prisma.heartbeat.count({ where: { userId: apiKey.userId } });
        if (heartbeatCount >= 30) {
            await checkAndUnlock('hour-1');
        }

        // 3. "Polyglot" - 3 languages
        const languagesCount = await prisma.heartbeat.groupBy({
            by: ['language'],
            where: { userId: apiKey.userId }
        });
        if (languagesCount.length >= 3) {
            await checkAndUnlock('languages-3');
        }

        return NextResponse.json({ status: "ok" });
    } catch (error: any) {
        console.error("Heartbeat error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        status: "alive",
        message: "DevMeter Heartbeat API is reachable. Use POST to record activity."
    });
}
