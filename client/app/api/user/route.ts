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
        // Soft delete user and anonymize email to allow re-registration
        await prisma.user.update({
            where: { id: userId },
            data: {
                deletedAt: new Date(),
                email: `deleted-${Date.now()}-${userEmail}`,
            },
        });

        // Revoke all sessions
        await prisma.session.deleteMany({
            where: { userId: userId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
