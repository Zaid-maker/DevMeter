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

        // 1. Activity by Day
        const activityByDay = Array.from({ length: 7 }).map((_, i) => {
            const date = subDays(now, 6 - i);
            const dateStr = format(date, "EEE");
            const dayStart = startOfDay(date);
            const dayEnd = new Date(dayStart.getTime() + 86400000);

            // Simple heuristic: count distinct 2-minute slots (heartbeats)
            const dayHeartbeats = heartbeats.filter(h =>
                new Date(h.timestamp) >= dayStart && new Date(h.timestamp) < dayEnd
            ).length;

            const hours = (dayHeartbeats * 2) / 60; // 2 minutes per heartbeat

            return { name: dateStr, total: parseFloat(hours.toFixed(1)) };
        });

        // 2. Language Breakdown
        const langMap = new Map<string, number>();
        heartbeats.forEach(h => {
            langMap.set(h.language, (langMap.get(h.language) || 0) + 1);
        });

        const totalHeartbeats = heartbeats.length;
        const languages = Array.from(langMap.entries())
            .map(([name, count]) => ({
                name,
                value: Math.round((count / totalHeartbeats) * 100),
                color: getLanguageColor(name)
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        // 3. Top Projects List
        const projectMap = new Map<string, number>();
        heartbeats.forEach(h => {
            projectMap.set(h.project, (projectMap.get(h.project) || 0) + 1);
        });

        const projects = Array.from(projectMap.entries())
            .map(([name, count]) => ({
                name,
                value: Math.round((count / totalHeartbeats) * 100),
                hours: parseFloat(((count * 2) / 60).toFixed(1))
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        const topProject = projects[0]?.name || "None";

        const totalMinutes = totalHeartbeats * 2;
        const totalHours = Math.floor(totalMinutes / 60);
        const remainingMinutes = totalMinutes % 60;

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
                totalTime: `${totalHours}h ${remainingMinutes}m`,
                dailyAverage: `${((totalMinutes / 7) / 60).toFixed(1)}h`,
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
