import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { startOfDay, subDays, format } from "date-fns";
import { TZDate } from "@date-fns/tz";
import { calculateDuration, calculateStreaks } from "@/lib/stats-utils";
import { getLanguageColor, getLanguageIcon, getEditorColor, getPlatformColor, getProjectColor } from "@/lib/stats-service";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    const { username } = await params;

    const user = await prisma.user.findUnique({
        where: { username },
        select: {
            id: true,
            name: true,
            image: true,
            username: true,
            publicProfile: true,
            githubUrl: true,
            linkedinUrl: true,
            hideProjects: true,
            createdAt: true,
            xp: true,
            level: true,
            deletedAt: true,
            timezone: true,
            achievements: {
                include: { achievement: true },
                orderBy: { unlockedAt: "desc" },
            },
        },
    });

    if (!user || user.deletedAt || !user.publicProfile) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const timezone = user.timezone || "UTC";
    const now = new Date();
    const zonedNow = new TZDate(now, timezone);
    const zonedTodayStart = startOfDay(zonedNow);
    const startDate = subDays(zonedTodayStart, 14);

    try {
        // Fetch heartbeats (last 14 days for weekly stats)
        const allHeartbeats = await prisma.heartbeat.findMany({
            where: {
                userId: user.id,
                timestamp: { gte: startDate, lte: now },
            },
        });

        const currentWeekStartLocal = subDays(zonedTodayStart, 6);
        const heartbeats = allHeartbeats.filter(
            (h) => new TZDate(h.timestamp, timezone) >= currentWeekStartLocal
        );

        // Language breakdown
        const langGroups = new Map<string, typeof heartbeats>();
        heartbeats.forEach((h) => {
            if (!langGroups.has(h.language)) langGroups.set(h.language, []);
            langGroups.get(h.language)!.push(h);
        });

        const langDurations = Array.from(langGroups.entries()).map(([name, hList]) => ({
            name,
            duration: calculateDuration(hList),
        }));

        const totalDuration = langDurations.reduce((acc, curr) => acc + curr.duration, 0);

        const languages = langDurations
            .map((ld) => ({
                name: ld.name,
                value: totalDuration > 0 ? Math.round((ld.duration / totalDuration) * 100) : 0,
                color: getLanguageColor(ld.name),
                icon: getLanguageIcon(ld.name),
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        // Project breakdown
        const projectGroups = new Map<string, typeof heartbeats>();
        heartbeats.forEach((h) => {
            if (!projectGroups.has(h.project)) projectGroups.set(h.project, []);
            projectGroups.get(h.project)!.push(h);
        });

        const projectDurations = Array.from(projectGroups.entries()).map(([name, hList]) => ({
            name,
            duration: calculateDuration(hList),
        }));

        const projects = projectDurations
            .map((pd) => ({
                name: pd.name,
                value: totalDuration > 0 ? Math.round((pd.duration / totalDuration) * 100) : 0,
                hours: parseFloat(pd.duration.toFixed(1)),
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5)
            .map((p, i) => ({ ...p, color: getProjectColor(i) }));

        // Editor breakdown
        const editorGroups = new Map<string, typeof heartbeats>();
        heartbeats.forEach((h) => {
            const editor = h.editor;
            if (!editor || editor.toLowerCase() === "unknown") return;
            if (!editorGroups.has(editor)) editorGroups.set(editor, []);
            editorGroups.get(editor)!.push(h);
        });

        const editors = Array.from(editorGroups.entries())
            .map(([name, hList]) => ({
                name,
                value: totalDuration > 0 ? Math.round((calculateDuration(hList) / totalDuration) * 100) : 0,
                color: getEditorColor(name),
            }))
            .sort((a, b) => b.value - a.value);

        // Platform breakdown
        const platformGroups = new Map<string, typeof heartbeats>();
        heartbeats.forEach((h) => {
            const platform = h.platform;
            if (!platform || platform.toLowerCase() === "unknown") return;
            if (!platformGroups.has(platform)) platformGroups.set(platform, []);
            platformGroups.get(platform)!.push(h);
        });

        const platforms = Array.from(platformGroups.entries())
            .map(([name, hList]) => ({
                name,
                value: totalDuration > 0 ? Math.round((calculateDuration(hList) / totalDuration) * 100) : 0,
                color: getPlatformColor(name),
            }))
            .sort((a, b) => b.value - a.value);

        // Activity by day (last 7 days)
        const activityByDay = Array.from({ length: 7 }).map((_, i) => {
            const localDayDate = subDays(zonedTodayStart, 6 - i);
            const dayStr = format(localDayDate, "EEE");
            const dayStart = startOfDay(localDayDate);
            const dayEnd = new Date(dayStart.getTime() + 86400000);

            const dayHeartbeats = heartbeats.filter((h) => {
                const zoned = new TZDate(h.timestamp, timezone);
                return zoned >= dayStart && zoned < dayEnd;
            });

            return { name: dayStr, total: parseFloat(calculateDuration(dayHeartbeats).toFixed(1)) };
        });

        // Contribution data (last 365 days)
        const contribStartDate = subDays(startOfDay(now), 365);
        const contribHeartbeats = await prisma.heartbeat.findMany({
            where: {
                userId: user.id,
                timestamp: { gte: contribStartDate },
            },
            orderBy: { timestamp: "asc" },
        });

        const dailyHeartbeats: Record<string, typeof contribHeartbeats> = {};
        contribHeartbeats.forEach((h) => {
            const dayStr = format(new TZDate(h.timestamp, timezone), "yyyy-MM-dd");
            if (!dailyHeartbeats[dayStr]) dailyHeartbeats[dayStr] = [];
            dailyHeartbeats[dayStr].push(h);
        });

        const contributions = Object.entries(dailyHeartbeats).map(([date, hList]) => ({
            date,
            count: parseFloat(calculateDuration(hList).toFixed(2)),
        }));

        const activeDays = new Set(Object.keys(dailyHeartbeats));
        const { current: currentStreak, longest: longestStreak } = calculateStreaks(activeDays, timezone);

        const totalContribHours = contributions.reduce((acc, curr) => acc + curr.count, 0);

        // Achievements
        const allAchievements = await prisma.achievement.findMany({
            orderBy: { createdAt: "asc" },
        });

        const userUnlockedSlugs = new Set(user.achievements.map((ua) => ua.achievement.slug));
        const userUnlockedMap = new Map(user.achievements.map((ua) => [ua.achievement.slug, ua.unlockedAt]));

        const achievements = allAchievements.map((a) => ({
            id: a.id,
            slug: a.slug,
            name: a.name,
            description: a.description,
            icon: a.icon,
            isUnlocked: userUnlockedSlugs.has(a.slug),
            unlockedAt: userUnlockedMap.get(a.slug),
        }));

        const totalHoursVal = Math.floor(totalDuration);
        const remainingMinutes = Math.round((totalDuration - totalHoursVal) * 60);

        // Censor project names if user chose to hide them
        const publicProjects = user.hideProjects
            ? projects.map((p, i) => ({ ...p, name: `Project ${i + 1}` }))
            : projects;

        const publicTopProject = user.hideProjects
            ? (projects.length > 0 ? "Project 1" : "None")
            : (projects[0]?.name || "None");

        return NextResponse.json({
            user: {
                name: user.name,
                username: user.username,
                image: user.image,
                createdAt: user.createdAt,
                level: user.level,
                xp: user.xp,
                githubUrl: user.githubUrl,
                linkedinUrl: user.linkedinUrl,
            },
            stats: {
                totalTime: `${totalHoursVal}h ${remainingMinutes}m`,
                topLanguage: languages[0]?.name || "None",
                topLanguageIcon: languages[0]?.icon,
                topProject: publicTopProject,
                languages,
                projects: publicProjects,
                editors,
                platforms,
                activityByDay,
                achievements,
            },
            contribution: {
                contributions,
                streaks: { current: currentStreak, longest: longestStreak },
                summary: {
                    totalHours: parseFloat(totalContribHours.toFixed(1)),
                    daysActive: activeDays.size,
                    averagePerDay: activeDays.size > 0 ? parseFloat((totalContribHours / activeDays.size).toFixed(1)) : 0,
                },
            },
        });
    } catch (error) {
        console.error("Public stats API error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
