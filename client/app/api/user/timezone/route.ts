import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { timezone } = await req.json();

        if (!timezone || typeof timezone !== "string") {
            return NextResponse.json({ error: "Invalid timezone" }, { status: 400 });
        }

        // Runtime IANA validation
        try {
            new Intl.DateTimeFormat(undefined, { timeZone: timezone });
        } catch (e) {
            return NextResponse.json({ error: "Invalid timezone" }, { status: 400 });
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: { timezone },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Timezone update error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
