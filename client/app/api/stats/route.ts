import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { startOfDay, subDays, format } from "date-fns";

export async function GET(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();
    const last7Days = subDays(now, 7);

    try {
        // Fetch heartbeats for the last 7 days
        const heartbeats = await prisma.heartbeat.findMany({
            where: {
                userId,
                timestamp: {
                    gte: last7Days,
                },
            },
        });

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
                color: getLanguageColor(ld.name)
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
            .slice(0, 10);

        return NextResponse.json({
            activityByDay,
            languages,
            projects,
            recentActivity,
            summary: {
                totalTime: `${totalHoursVal}h ${remainingMinutes}m`,
                dailyAverage: `${(totalDuration / 7).toFixed(1)}h`,
                topProject,
                topLanguage: languages[0]?.name || "None"
            }
        });

    } catch (error) {
        console.error("Stats API error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
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
    };
    return colors[lang.toLowerCase()] || "#888888";
}
