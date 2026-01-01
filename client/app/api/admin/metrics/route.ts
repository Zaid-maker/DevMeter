import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { startOfDay, subDays, format } from "date-fns";

const ADMIN_SECRET = process.env.DEV_ADMIN_SECRET || "dev-secret-123";

function isOriginAllowed(origin: string | null) {
    if (!origin) return false;
    const rawAllowed = process.env.ALLOWED_ORIGINS || "http://localhost:5173";
    const allowedOrigins = rawAllowed.split(",").map(o => o.trim()).filter(o => o !== "*");
    return allowedOrigins.includes(origin);
}

function getCorsHeaders(origin: string | null) {
    const h: Record<string, string> = {
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Admin-Secret",
    };
    if (isOriginAllowed(origin)) {
        h["Access-Control-Allow-Origin"] = origin!;
    }
    return h;
}

export async function OPTIONS(req: NextRequest) {
    const origin = req.headers.get("origin");
    if (!isOriginAllowed(origin)) return new NextResponse(null, { status: 403 });
    return new NextResponse(null, { status: 204, headers: getCorsHeaders(origin) });
}

export async function GET(req: NextRequest) {
    const origin = req.headers.get("origin");
    const secret = req.headers.get("X-Admin-Secret");

    if (secret !== ADMIN_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: getCorsHeaders(origin) });
    }

    const now = new Date();
    const startDate = subDays(now, 7);

    try {
        // 1. System Traffic (Last 7 Days)
        const heartbeats = await prisma.heartbeat.findMany({
            where: { timestamp: { gte: startDate } },
            select: { timestamp: true, project: true, language: true, userId: true }
        });

        const trafficByDay = Array.from({ length: 7 }).map((_, i) => {
            const date = subDays(now, 6 - i);
            const dateStr = format(date, "EEE");
            const dayStart = startOfDay(date);
            const dayEnd = new Date(dayStart.getTime() + 86400000);

            const count = heartbeats.filter(h =>
                new Date(h.timestamp) >= dayStart && new Date(h.timestamp) < dayEnd
            ).length;

            return { name: dateStr, total: count };
        });

        // 2. Top Projects by Request Volume
        const projectCounts = new Map<string, number>();
        heartbeats.forEach(h => {
            projectCounts.set(h.project, (projectCounts.get(h.project) || 0) + 1);
        });

        const topProjects = Array.from(projectCounts.entries())
            .map(([name, count]) => ({
                name,
                value: Math.round((count / heartbeats.length) * 100),
                requests: count
            }))
            .sort((a, b) => b.requests - a.requests)
            .slice(0, 5);

        // 3. Language Distribution (System Wide)
        const langCounts = new Map<string, number>();
        heartbeats.forEach(h => {
            langCounts.set(h.language, (langCounts.get(h.language) || 0) + 1);
        });

        const languages = Array.from(langCounts.entries())
            .map(([name, count]) => ({
                name,
                value: Math.round((count / heartbeats.length) * 100),
                color: getLanguageColor(name)
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        // 4. System Summary
        const uniqueUsers = new Set(heartbeats.map(h => h.userId)).size;
        const totalRequests = heartbeats.length;
        const requests24h = heartbeats.filter(h => new Date(h.timestamp) >= subDays(now, 1)).length;

        // Calculate Growth (24h vs previous 24h)
        const prev24hStart = subDays(now, 2);
        const prev24hEnd = subDays(now, 1);
        const requestsPrev24h = heartbeats.filter(h =>
            new Date(h.timestamp) >= prev24hStart && new Date(h.timestamp) < prev24hEnd
        ).length;

        let growth = 0;
        if (requestsPrev24h > 0) {
            growth = Math.round(((requests24h - requestsPrev24h) / requestsPrev24h) * 100);
        }

        return NextResponse.json({
            activityByDay: trafficByDay,
            projects: topProjects,
            languages,
            summary: {
                totalRequests,
                requests24h,
                activeUsers: uniqueUsers,
                activeProjects: projectCounts.size,
                growth,
                isSystemOnline: true,
                systemLoad: (requests24h / 1440).toFixed(2) // Requests per minute avg
            }
        }, { headers: getCorsHeaders(origin) });

    } catch (error) {
        console.error("Admin Metrics API error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: getCorsHeaders(origin) });
    }
}

function getLanguageColor(lang: string): string {
    const colors: Record<string, string> = {
        typescript: "#3178c6", javascript: "#f1e05a", rust: "#dea584", python: "#3572A5",
        html: "#e34c26", css: "#563d7c", go: "#00ADD8", java: "#b07219",
        react: "#61dafb", nextjs: "#000000", docker: "#2496ed"
    };
    return colors[lang.toLowerCase()] || "#888888";
}
