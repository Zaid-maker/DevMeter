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

    try {
        const keys = await prisma.apiKey.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(keys);
    } catch (error) {
        console.error("GET /api/keys error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Enforce "One Key Per Account" limit
        const existingKey = await prisma.apiKey.findFirst({
            where: { userId: session.user.id },
        });

        if (existingKey) {
            return NextResponse.json(
                { error: "Limit reached: Only one API key is allowed per account." },
                { status: 400 }
            );
        }

        const { name } = await req.json().catch(() => ({ name: null }));

        const key = await prisma.apiKey.create({
            data: {
                userId: session.user.id,
                name: name || "Default Key",
            },
        });

        return NextResponse.json(key);
    } catch (error) {
        console.error("POST /api/keys error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const id = req.nextUrl.searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Key ID is required" }, { status: 400 });
        }

        // Verify ownership before deletion
        const key = await prisma.apiKey.findFirst({
            where: {
                id: id,
                userId: session.user.id,
            },
        });

        if (!key) {
            return NextResponse.json({ error: "Key not found or unauthorized" }, { status: 404 });
        }

        await prisma.apiKey.delete({
            where: { id: id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/keys error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
