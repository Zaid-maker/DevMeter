import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            username: true,
            publicProfile: true,
            githubUrl: true,
            linkedinUrl: true,
            hideProjects: true,
        },
    });

    return NextResponse.json({
        username: user?.username || null,
        publicProfile: user?.publicProfile ?? false,
        githubUrl: user?.githubUrl || null,
        linkedinUrl: user?.linkedinUrl || null,
        hideProjects: user?.hideProjects ?? false,
    });
}

export async function PATCH(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data: Record<string, any> = {};

    if (typeof body.publicProfile === "boolean") {
        data.publicProfile = body.publicProfile;
    }
    if (typeof body.hideProjects === "boolean") {
        data.hideProjects = body.hideProjects;
    }
    if (typeof body.githubUrl === "string") {
        data.githubUrl = body.githubUrl.trim() || null;
    }
    if (typeof body.linkedinUrl === "string") {
        data.linkedinUrl = body.linkedinUrl.trim() || null;
    }

    if (Object.keys(data).length === 0) {
        return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const updated = await prisma.user.update({
        where: { id: session.user.id },
        data,
        select: {
            publicProfile: true,
            githubUrl: true,
            linkedinUrl: true,
            hideProjects: true,
        },
    });

    return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    try {

        // Perform soft delete and revocation in a transaction
        await prisma.$transaction(async (tx) => {
            // 1. Soft delete user - Keep email for reactivation flow
            await tx.user.update({
                where: { id: userId },
                data: {
                    deletedAt: new Date(),
                },
            });

            // 2. Revoke all sessions except the current one
            // This prevents a P2025 error when the client calls signOut() immediately after
            await tx.session.deleteMany({
                where: {
                    userId: userId,
                    NOT: { id: session.session.id }
                },
            });

            // 3. Revoke all API keys
            await tx.apiKey.deleteMany({
                where: { userId: userId },
            });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
