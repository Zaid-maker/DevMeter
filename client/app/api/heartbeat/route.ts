import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKeyStr = authHeader.split(" ")[1];

    try {
        // Find the API key and associated user
        const apiKey = await prisma.apiKey.findUnique({
            where: { key: apiKeyStr },
            include: { user: true }
        });

        if (!apiKey) {
            return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
        }

        const body = await req.json();
        const { project, language, file, type, is_save, timestamp } = body;

        // Record the heartbeat
        await prisma.heartbeat.create({
            data: {
                userId: apiKey.userId,
                project: project || "Unknown",
                language: language || "unknown",
                file: file || "unknown",
                type: type || "file",
                isSave: is_save || false,
                timestamp: new Date(timestamp || Date.now()),
            }
        });

        return NextResponse.json({ status: "ok" });
    } catch (error: any) {
        console.error("Heartbeat error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
