import { prisma } from "@/lib/prisma";
import { validateAdminAuth, validateNumber } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

/**
 * GET /api/admin/discord-role-rules
 * Lists Discord role rules with optional filters
 * @param req - Request with x-admin-secret header and optional guildId, enabled query params
 */
export async function GET(req: NextRequest) {
    const authError = validateAdminAuth(req);
    if (authError) return authError;

    try {
        const guildId = req.nextUrl.searchParams.get("guildId");
        const enabledOnly = req.nextUrl.searchParams.get("enabled") === "true";

        const whereClause: Prisma.DiscordRoleRuleWhereInput = {};
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

/**
 * POST /api/admin/discord-role-rules
 * Creates a new Discord role rule
 * @param req - Request with x-admin-secret header and rule data in body
 */
export async function POST(req: NextRequest) {
    const authError = validateAdminAuth(req);
    if (authError) return authError;

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

        // Validate numeric fields
        const validatedMinHours = minHours !== undefined ? validateNumber(minHours, "minHours", { min: 0 }) : null;
        const validatedMinXp = minXp !== undefined ? validateNumber(minXp, "minXp", { min: 0 }) : null;
        const validatedMinLevel = minLevel !== undefined ? validateNumber(minLevel, "minLevel", { min: 1 }) : null;
        const validatedMinHeartbeats = minHeartbeats !== undefined ? validateNumber(minHeartbeats, "minHeartbeats", { min: 0 }) : null;
        const validatedPriority = priority !== undefined ? (validateNumber(priority, "priority", { min: 0 }) ?? 0) : 0;

        const rule = await prisma.discordRoleRule.create({
            data: {
                guildId,
                name,
                roleId,
                minHours: validatedMinHours,
                minXp: validatedMinXp,
                minLevel: validatedMinLevel,
                minHeartbeats: validatedMinHeartbeats,
                priority: validatedPriority,
                enabled: enabled !== undefined ? Boolean(enabled) : true,
            },
        });

        return NextResponse.json({ rule }, { status: 201 });
    } catch (error) {
        console.error("POST /api/admin/discord-role-rules error:", error);

        if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
            return NextResponse.json(
                { error: "A rule with this guildId and roleId already exists" },
                { status: 409 }
            );
        }

        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

/**
 * PUT /api/admin/discord-role-rules
 * Updates an existing Discord role rule
 * @param req - Request with x-admin-secret header and update data in body
 */
export async function PUT(req: NextRequest) {
    const authError = validateAdminAuth(req);
    if (authError) return authError;

    try {
        const body = await req.json();
        const { id, name, minHours, minXp, minLevel, minHeartbeats, priority, enabled } = body;

        if (!id || typeof id !== "string") {
            return NextResponse.json({ error: "id is required and must be a string" }, { status: 400 });
        }

        const updateData: Prisma.DiscordRoleRuleUpdateInput = {};
        if (name !== undefined) updateData.name = name;
        if (minHours !== undefined) updateData.minHours = minHours !== null ? validateNumber(minHours, "minHours", { min: 0 }) : null;
        if (minXp !== undefined) updateData.minXp = minXp !== null ? validateNumber(minXp, "minXp", { min: 0 }) : null;
        if (minLevel !== undefined) updateData.minLevel = minLevel !== null ? validateNumber(minLevel, "minLevel", { min: 1 }) : null;
        if (minHeartbeats !== undefined) updateData.minHeartbeats = minHeartbeats !== null ? validateNumber(minHeartbeats, "minHeartbeats", { min: 0 }) : null;
        if (priority !== undefined) updateData.priority = validateNumber(priority, "priority", { min: 0, required: true }) ?? 0;
        if (enabled !== undefined) updateData.enabled = Boolean(enabled);

        const rule = await prisma.discordRoleRule.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({ rule });
    } catch (error) {
        console.error("PUT /api/admin/discord-role-rules error:", error);

        if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
            return NextResponse.json({ error: "Role rule not found" }, { status: 404 });
        }

        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/discord-role-rules
 * Deletes a Discord role rule by ID
 * @param req - Request with x-admin-secret header and id query param
 */
export async function DELETE(req: NextRequest) {
    const authError = validateAdminAuth(req);
    if (authError) return authError;

    try {
        const id = req.nextUrl.searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "id query parameter is required" }, { status: 400 });
        }

        await prisma.discordRoleRule.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/admin/discord-role-rules error:", error);

        if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
            return NextResponse.json({ error: "Role rule not found" }, { status: 404 });
        }

        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
