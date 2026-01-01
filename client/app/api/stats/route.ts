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
    const now = new Date();

    // Check for range query parameter
    const searchParams = req.nextUrl.searchParams;
    const range = searchParams.get("range"); // e.g., "today"

    let startDate = subDays(now, 14); // Fetch last 14 days for growth comparison
    if (range === "today") {
        startDate = startOfDay(now);
    }

    try {
        // Fetch heartbeats
        const allHeartbeats = await prisma.heartbeat.findMany({
            where: {
                userId,
                timestamp: {
                    gte: startDate,
                },
            },
        });

        // Split heartbeats into current week and previous week
        const currentWeekStart = subDays(now, 7);
        const heartbeats = allHeartbeats.filter(h => new Date(h.timestamp) >= currentWeekStart);
        const prevWeekHeartbeats = allHeartbeats.filter(h => new Date(h.timestamp) < currentWeekStart);

        // Helper function to calculate duration in hours from heartbeats
        const calculateDuration = (hList: typeof heartbeats) => {
            if (hList.length === 0) return 0;
            const sorted = [...hList].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            let totalSeconds = 0;
            const SESSION_GAP = 15 * 60 * 1000; // 15 minutes session gap
            const HEARTBEAT_VAL = 2 * 60 * 1000; // Each heartbeat assumes at least 2 mins of work

            let lastTime = new Date(sorted[0].timestamp).getTime();
            totalSeconds += HEARTBEAT_VAL / 1000;

            for (let i = 1; i < sorted.length; i++) {
                const currentTime = new Date(sorted[i].timestamp).getTime();
                const diff = currentTime - lastTime;

                if (diff < SESSION_GAP) {
                    // Part of same session
                    totalSeconds += diff / 1000;
                } else {
                    // New session starts
                    totalSeconds += HEARTBEAT_VAL / 1000;
                }
                lastTime = currentTime;
            }

            return totalSeconds / 3600;
        };

        // 1. Activity by Day
        const activityByDay = Array.from({ length: 7 }).map((_, i) => {
            const date = subDays(now, 6 - i);
            const dateStr = format(date, "EEE");
            const dayStart = startOfDay(date);
            const dayEnd = new Date(dayStart.getTime() + 86400000);

            const dayHeartbeats = heartbeats.filter(h =>
                new Date(h.timestamp) >= dayStart && new Date(h.timestamp) < dayEnd
            );

            const hours = calculateDuration(dayHeartbeats);

            return { name: dateStr, total: parseFloat(hours.toFixed(1)) };
        });

        // 2. Language Breakdown
        const langGroups = new Map<string, typeof heartbeats>();
        heartbeats.forEach(h => {
            if (!langGroups.has(h.language)) langGroups.set(h.language, []);
            langGroups.get(h.language)!.push(h);
        });

        const langDurations = Array.from(langGroups.entries()).map(([name, hList]) => ({
            name,
            duration: calculateDuration(hList)
        }));

        const totalDuration = langDurations.reduce((acc, curr) => acc + curr.duration, 0);

        const languages = langDurations
            .map(ld => ({
                name: ld.name,
                value: totalDuration > 0 ? Math.round((ld.duration / totalDuration) * 100) : 0,
                color: getLanguageColor(ld.name),
                icon: getLanguageIcon(ld.name)
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        // 3. Top Projects List
        const projectGroups = new Map<string, typeof heartbeats>();
        heartbeats.forEach(h => {
            if (!projectGroups.has(h.project)) projectGroups.set(h.project, []);
            projectGroups.get(h.project)!.push(h);
        });

        const projectDurations = Array.from(projectGroups.entries()).map(([name, hList]) => ({
            name,
            duration: calculateDuration(hList)
        }));

        const projects = projectDurations
            .map(pd => ({
                name: pd.name,
                value: totalDuration > 0 ? Math.round((pd.duration / totalDuration) * 100) : 0,
                hours: parseFloat(pd.duration.toFixed(1))
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        const topProject = projects[0]?.name || "None";

        const totalHoursVal = Math.floor(totalDuration);
        const remainingMinutes = Math.round((totalDuration - totalHoursVal) * 60);

        // 4. Recent Activity
        const recentActivity = heartbeats
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 10)
            .map(h => ({
                ...h,
                color: getLanguageColor(h.language),
                icon: getLanguageIcon(h.language)
            }));

        const lastHeartbeat = recentActivity[0];
        const isLive = lastHeartbeat
            ? (now.getTime() - new Date(lastHeartbeat.timestamp).getTime()) < 15 * 60 * 1000
            : false;

        // 5. 24-Hour Specific Stats (for Quick Stats Cards)
        const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last24hHeartbeats = heartbeats.filter(h => new Date(h.timestamp) >= dayAgo);

        const totalDuration24h = calculateDuration(last24hHeartbeats);
        const totalHours24h = Math.floor(totalDuration24h);
        const remainingMinutes24h = Math.round((totalDuration24h - totalHours24h) * 60);

        // Top Project (24h)
        const proj24hGroups = new Map<string, typeof heartbeats>();
        last24hHeartbeats.forEach(h => {
            if (!proj24hGroups.has(h.project)) proj24hGroups.set(h.project, []);
            proj24hGroups.get(h.project)!.push(h);
        });
        const proj24hDurs = Array.from(proj24hGroups.entries()).map(([name, hList]) => ({
            name,
            duration: calculateDuration(hList)
        })).sort((a, b) => b.duration - a.duration);
        const topProject24h = proj24hDurs[0]?.name || "None";

        // Top Language (24h)
        const lang24hGroups = new Map<string, typeof heartbeats>();
        last24hHeartbeats.forEach(h => {
            if (!lang24hGroups.has(h.language)) lang24hGroups.set(h.language, []);
            lang24hGroups.get(h.language)!.push(h);
        });
        const lang24hDurs = Array.from(lang24hGroups.entries()).map(([name, hList]) => ({
            name,
            duration: calculateDuration(hList)
        })).sort((a, b) => b.duration - a.duration);
        const topLanguage24h = lang24hDurs[0]?.name || "None";

        // Calculate Weekly Growth
        const currentWeekHours = calculateDuration(heartbeats);
        const prevWeekHours = calculateDuration(prevWeekHeartbeats);
        let percentGrowth = 0;
        if (prevWeekHours > 0) {
            percentGrowth = Math.round(((currentWeekHours - prevWeekHours) / prevWeekHours) * 100);
        } else if (currentWeekHours > 0) {
            percentGrowth = 100; // 100% growth if starting from zero
        }

        // Calculate Current Streak
        // Fetch all heartbeat dates for the user (only need dates)
        const streakHeartbeats = await prisma.heartbeat.findMany({
            where: { userId },
            select: { timestamp: true },
            orderBy: { timestamp: 'desc' }
        });

        const activeDays = new Set(streakHeartbeats.map(h => format(new Date(h.timestamp), "yyyy-MM-dd")));
        let currentStreak = 0;
        const todayStr = format(now, "yyyy-MM-dd");
        const yesterdayStr = format(subDays(now, 1), "yyyy-MM-dd");

        if (activeDays.has(todayStr) || activeDays.has(yesterdayStr)) {
            let checkDate = activeDays.has(todayStr) ? now : subDays(now, 1);
            while (activeDays.has(format(checkDate, "yyyy-MM-dd"))) {
                currentStreak++;
                checkDate = subDays(checkDate, 1);
            }
        }

        return NextResponse.json({
            activityByDay,
            languages,
            projects,
            recentActivity,
            summary: {
                totalTime: `${totalHoursVal}h ${remainingMinutes}m`,
                totalTime24h: `${totalHours24h}h ${remainingMinutes24h}m`,
                dailyAverage: `${(totalDuration / 7).toFixed(1)}h`,
                topProject,
                topProject24h,
                topLanguage: languages[0]?.name || "None",
                topLanguage24h,
                topLanguageIcon: languages[0]?.icon,
                topLanguageIcon24h: topLanguage24h !== "None" ? getLanguageIcon(topLanguage24h) : undefined,
                isLive,
                lastHeartbeatAt: lastHeartbeat?.timestamp,
                percentGrowth,
                currentStreak
            }
        }, { headers: getCorsHeaders(req.headers.get("origin")) });

    } catch (error) {
        console.error("Stats API error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: getCorsHeaders(req.headers.get("origin")) });
    }
}

function getLanguageColor(lang: string): string {
    const colors: Record<string, string> = {
        typescript: "#3178c6",
        javascript: "#f1e05a",
        rust: "#dea584",
        python: "#3572A5",
        html: "#e34c26",
        css: "#563d7c",
        go: "#00ADD8",
        java: "#b07219",
        cpp: "#f34b7d",
        c: "#555555",
        csharp: "#178600",
        php: "#4F5D95",
        ruby: "#701516",
        swift: "#ffac45",
        kotlin: "#F18E33",
        dart: "#00B4AB",
        elixir: "#6e4a7e",
        haskell: "#5e5086",
        lua: "#000080",
        matlab: "#e16737",
        r: "#198ce7",
        scala: "#c22d40",
        shell: "#89e051",
        sql: "#e38c00",
        zig: "#ec915c",
        vue: "#41b883",
        react: "#61dafb",
        svelte: "#ff3e00",
        nextjs: "#000000",
        docker: "#2496ed",
        kubernetes: "#326ce5",
        markdown: "#083fa1",
        json: "#292929",
        yaml: "#cb171e",
    };
    return colors[lang.toLowerCase()] || "#888888";
}

function getLanguageIcon(lang: string): string {
    const langMap: Record<string, string> = {
        typescript: "typescript",
        javascript: "javascript",
        rust: "rust",
        python: "python",
        html: "html5",
        css: "css3",
        go: "go",
        java: "java",
        cpp: "cplusplus",
        c: "c",
        csharp: "csharp",
        php: "php",
        ruby: "ruby",
        swift: "swift",
        kotlin: "kotlin",
        dart: "dart",
        elixir: "elixir",
        haskell: "haskell",
        lua: "lua",
        matlab: "matlab",
        r: "r",
        scala: "scala",
        shell: "bash",
        sql: "mysql", // Fallback to mysql for generic SQL
        zig: "zig",
        vue: "vuejs",
        react: "react",
        svelte: "svelte",
        nextjs: "nextjs",
        docker: "docker",
        kubernetes: "kubernetes",
        markdown: "markdown",
    };

    const name = langMap[lang.toLowerCase()] || lang.toLowerCase();
    return `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${name}/${name}-original.svg`;
}
