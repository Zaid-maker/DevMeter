import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { calculateUserStats } from "@/lib/stats-service";

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

function getCorsHeaders(origin: string | null, allowAnyOrigin = false) {
    const h: Record<string, string> = {
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (allowAnyOrigin) {
        // Safe for API-key-authenticated extension requests: Bearer tokens are not
        // ambient credentials, so wildcard CORS does not expose user data to
        // cross-site requests that rely on cookies / sessions.
        h["Access-Control-Allow-Origin"] = "*";
    } else if (isOriginAllowed(origin)) {
        h["Access-Control-Allow-Origin"] = origin!;
    }

    return h;
}

export async function OPTIONS(req: NextRequest) {
    const origin = req.headers.get("origin");
    // Requests from the web dashboard use the configured ALLOWED_ORIGINS.
    if (origin && isOriginAllowed(origin)) {
        return new NextResponse(null, { status: 204, headers: getCorsHeaders(origin) });
    }
    // Extension requests may come from any origin (VS Code forks, web environments).
    // Use wildcard since they are authenticated via Bearer API key.
    return new NextResponse(null, { status: 204, headers: getCorsHeaders(null, true) });
}

export async function GET(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    let userId: string;
    // Track whether auth came from an API key (extension) so we can use open CORS
    let isApiKeyAuth = false;

    if (session) {
        userId = session.user.id;
    } else {
        // Fallback to API Key for extension
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: getCorsHeaders(req.headers.get("origin")) });
        }

        const apiKeyStr = authHeader.split(" ")[1];
        const apiKey = await prisma.apiKey.findUnique({
            where: { key: apiKeyStr },
        });

        if (!apiKey) {
            return NextResponse.json({ error: "Invalid API Key" }, { status: 401, headers: getCorsHeaders(req.headers.get("origin")) });
        }

        userId = apiKey.userId;
        isApiKeyAuth = true;
    }

    // Check for range query parameter
    const searchParams = req.nextUrl.searchParams;
    const range = searchParams.get("range") as "today" | "all" | null;

    // Fetch user and timezone
    // Fetch user and timezone
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { timezone: true, deletedAt: true },
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.deletedAt) {
        return NextResponse.json({ error: "User account is deleted" }, { status: 401, headers: getCorsHeaders(req.headers.get("origin"), isApiKeyAuth) });
    }

    const timezone = user.timezone || "UTC";
    const cacheKey = `stats:${userId}:${range || "default"}`;

    try {
        // Try to get from cache first
        const cacheData = await redis.get(cacheKey);
        const corsHeaders = getCorsHeaders(req.headers.get("origin"), isApiKeyAuth);

        if (cacheData) {
            return NextResponse.json(cacheData, {
                headers: { ...corsHeaders, "X-Cache": "HIT" }
            });
        }

        const stats = await calculateUserStats(userId, range || undefined, timezone);

        // Cache the results for 5 minutes
        await redis.set(cacheKey, stats, { ex: 300 });

        return NextResponse.json(stats, {
            headers: { ...corsHeaders, "X-Cache": "MISS" }
        });
    } catch (error) {
        console.error("Stats API error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: getCorsHeaders(req.headers.get("origin"), isApiKeyAuth) });
    }
}
