import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { startOfDay, subDays, format } from "date-fns";

// SECURITY: Never use wildcard ("*") for authenticated endpoints. 
// Only allow explicit origins defined in ALLOWED_ORIGINS environment variable.
function isOriginAllowed(origin: string | null) {
    if (!origin) return false;

    const rawAllowed = process.env.ALLOWED_ORIGINS || "http://localhost:5173";
    const allowedOrigins = rawAllowed
        .split(",")
        .map(o => o.trim())
        // Explicitly filter out any wildcard entries to prevent security bypass
        .filter(o => o !== "*");

    return allowedOrigins.includes(origin);
}

function getCorsHeaders(origin: string | null) {
    const h: Record<string, string> = {
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (isOriginAllowed(origin)) {
        h["Access-Control-Allow-Origin"] = origin!;
    }

    return h;
}

export async function OPTIONS(req: NextRequest) {
    const origin = req.headers.get("origin");
    if (!isOriginAllowed(origin)) {
        return new NextResponse(null, { status: 403 });
    }
    return new NextResponse(null, { status: 204, headers: getCorsHeaders(origin) });
}

import { calculateUserStats } from "@/lib/stats-service";

export async function GET(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    let userId: string;

    if (session) {
        userId = session.user.id;
    } else {
        // Fallback to API Key for extension
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const apiKeyStr = authHeader.split(" ")[1];
        const apiKey = await prisma.apiKey.findUnique({
            where: { key: apiKeyStr },
        });

        if (!apiKey) {
            return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
        }

        userId = apiKey.userId;
    }

    // Check for range query parameter
    const searchParams = req.nextUrl.searchParams;
    const range = searchParams.get("range") as "today" | "all" | null;

    try {
        const stats = await calculateUserStats(userId, range || undefined);
        return NextResponse.json(stats, { headers: getCorsHeaders(req.headers.get("origin")) });
    } catch (error) {
        console.error("Stats API error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: getCorsHeaders(req.headers.get("origin")) });
    }
}

// Language helpers moved to @/lib/stats-service
