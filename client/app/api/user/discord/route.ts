import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

type DiscordJoinStatus = "joined" | "failed" | "pending" | null;

export async function GET() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                discordUserId: true,
                discordUsername: true,
                discordLinkedAt: true,
                discordJoinStatus: true,
            },
        });

        return NextResponse.json({
            linked: Boolean(user?.discordUserId),
            discordUserId: user?.discordUserId ?? null,
            discordUsername: user?.discordUsername ?? null,
            discordLinkedAt: user?.discordLinkedAt ?? null,
            discordJoinStatus: (user?.discordJoinStatus ?? null) as DiscordJoinStatus,
        });
    } catch (error) {
        console.error("GET /api/user/discord error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                discordUserId: null,
                discordUsername: null,
                discordLinkedAt: null,
                discordJoinStatus: null,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/user/discord error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json().catch(() => ({}));
        const joinStatus = body?.joinStatus as DiscordJoinStatus;
        const validStatuses: DiscordJoinStatus[] = ["joined", "failed", "pending", null];

        if (!validStatuses.includes(joinStatus)) {
            return NextResponse.json({ error: "Invalid joinStatus" }, { status: 400 });
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                discordJoinStatus: joinStatus,
            },
        });

        return NextResponse.json({ success: true, joinStatus });
    } catch (error) {
        console.error("PATCH /api/user/discord error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
