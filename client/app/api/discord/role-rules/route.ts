import { prisma } from "@/lib/prisma";
import { validateDiscordSyncAuth } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/discord/role-rules
 * Public endpoint for Discord bot to fetch active role rules for a guild
 * @param req - Request with x-admin-secret header and guildId query param
 */
export async function GET(req: NextRequest) {
    const authError = validateDiscordSyncAuth(req);
    if (authError) return authError;

    try {
        const guildId = req.nextUrl.searchParams.get("guildId");

        if (!guildId) {
            return NextResponse.json({ error: "guildId query parameter is required" }, { status: 400 });
        }

        const rules = await prisma.discordRoleRule.findMany({
            where: {
                guildId,
                enabled: true,
            },
            orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
            select: {
                id: true,
                name: true,
                roleId: true,
                minHours: true,
                minXp: true,
                minLevel: true,
                minHeartbeats: true,
                priority: true,
            },
        });

        return NextResponse.json({ rules });
    } catch (error) {
        console.error("GET /api/discord/role-rules error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
