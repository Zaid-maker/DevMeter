import { prisma } from "@/lib/prisma";
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

export async function GET(req: NextRequest) {
    const secret = req.headers.get("x-admin-secret");
    const activeSecret = getAdminSecret();

    if (secret !== activeSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
