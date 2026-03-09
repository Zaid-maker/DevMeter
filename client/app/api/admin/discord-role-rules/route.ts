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
        const enabledOnly = req.nextUrl.searchParams.get("enabled") === "true";

        const whereClause: any = {};
        if (guildId) whereClause.guildId = guildId;
        if (enabledOnly) whereClause.enabled = true;

        const rules = await prisma.discordRoleRule.findMany({
            where: whereClause,
            orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
        });

        return NextResponse.json({ rules });
    } catch (error) {
        console.error("GET /api/admin/discord-role-rules error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const secret = req.headers.get("x-admin-secret");
    const activeSecret = getAdminSecret();

    if (secret !== activeSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { guildId, name, roleId, minHours, minXp, minLevel, minHeartbeats, priority, enabled } = body;

        if (!guildId || typeof guildId !== "string") {
            return NextResponse.json({ error: "guildId is required and must be a string" }, { status: 400 });
        }

        if (!name || typeof name !== "string") {
            return NextResponse.json({ error: "name is required and must be a string" }, { status: 400 });
        }

        if (!roleId || typeof roleId !== "string") {
            return NextResponse.json({ error: "roleId is required and must be a string" }, { status: 400 });
        }

        const rule = await prisma.discordRoleRule.create({
            data: {
                guildId,
                name,
                roleId,
                minHours: minHours !== undefined ? Number(minHours) : null,
                minXp: minXp !== undefined ? Number(minXp) : null,
                minLevel: minLevel !== undefined ? Number(minLevel) : null,
                minHeartbeats: minHeartbeats !== undefined ? Number(minHeartbeats) : null,
                priority: priority !== undefined ? Number(priority) : 0,
                enabled: enabled !== undefined ? Boolean(enabled) : true,
            },
        });

        return NextResponse.json({ rule }, { status: 201 });
    } catch (error: any) {
        console.error("POST /api/admin/discord-role-rules error:", error);

        if (error.code === "P2002") {
            return NextResponse.json(
                { error: "A rule with this guildId and roleId already exists" },
                { status: 409 }
            );
        }

        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    const secret = req.headers.get("x-admin-secret");
    const activeSecret = getAdminSecret();

    if (secret !== activeSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, name, minHours, minXp, minLevel, minHeartbeats, priority, enabled } = body;

        if (!id || typeof id !== "string") {
            return NextResponse.json({ error: "id is required and must be a string" }, { status: 400 });
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (minHours !== undefined) updateData.minHours = minHours !== null ? Number(minHours) : null;
        if (minXp !== undefined) updateData.minXp = minXp !== null ? Number(minXp) : null;
        if (minLevel !== undefined) updateData.minLevel = minLevel !== null ? Number(minLevel) : null;
        if (minHeartbeats !== undefined)
            updateData.minHeartbeats = minHeartbeats !== null ? Number(minHeartbeats) : null;
        if (priority !== undefined) updateData.priority = Number(priority);
        if (enabled !== undefined) updateData.enabled = Boolean(enabled);

        const rule = await prisma.discordRoleRule.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({ rule });
    } catch (error: any) {
        console.error("PUT /api/admin/discord-role-rules error:", error);

        if (error.code === "P2025") {
            return NextResponse.json({ error: "Role rule not found" }, { status: 404 });
        }

        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const secret = req.headers.get("x-admin-secret");
    const activeSecret = getAdminSecret();

    if (secret !== activeSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const id = req.nextUrl.searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "id query parameter is required" }, { status: 400 });
        }

        await prisma.discordRoleRule.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("DELETE /api/admin/discord-role-rules error:", error);

        if (error.code === "P2025") {
            return NextResponse.json({ error: "Role rule not found" }, { status: 404 });
        }

        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
