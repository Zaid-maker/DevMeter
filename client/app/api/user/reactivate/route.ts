import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

/**
 * POST /api/user/reactivate
 * Clears the deletedAt flag for the authenticated user.
 */
export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                deletedAt: null,
            },
        });

        return NextResponse.json({ success: true, message: "Account reactivated successfully" });
    } catch (error) {
        console.error("Error reactivating user:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
