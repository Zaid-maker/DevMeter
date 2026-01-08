import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

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
            // 1. Soft delete user
            await tx.user.update({
                where: { id: userId },
                data: {
                    deletedAt: new Date(),
                    email: `deleted-${Date.now()}-${userEmail}`,
                },
            });

            // 2. Revoke all sessions
            await tx.session.deleteMany({
                where: { userId: userId },
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
