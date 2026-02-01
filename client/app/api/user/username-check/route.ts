import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const username = req.nextUrl.searchParams.get("username")?.trim().toLowerCase();

    if (!username || username.length < 3) {
        return NextResponse.json({ available: false, error: "Too short" });
    }

    const existing = await prisma.user.findUnique({
        where: { username },
        select: { id: true },
    });

    const available = !existing || existing.id === session.user.id;

    return NextResponse.json({ available });
}
