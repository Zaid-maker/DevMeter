import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

const USERNAME_REGEX = /^[a-z0-9]([a-z0-9_-]{1,28}[a-z0-9])$/;

export async function PUT(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const username = body.username?.trim().toLowerCase();

    if (!username) {
        return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    if (!USERNAME_REGEX.test(username)) {
        return NextResponse.json({
            error: "Username must be 3-30 characters, lowercase alphanumeric, hyphens and underscores allowed (not at start/end)"
        }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
        where: { username },
        select: { id: true },
    });

    if (existing && existing.id !== session.user.id) {
        return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }

    await prisma.user.update({
        where: { id: session.user.id },
        data: { username },
    });

    return NextResponse.json({ username });
}
