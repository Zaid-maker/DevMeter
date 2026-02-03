import { prisma } from "./prisma";
import { startOfDay, subDays, format } from "date-fns";
import { TZDate } from "@date-fns/tz";
import { calculateDuration, calculateStreaks } from "./stats-utils";

export interface Stats {
    activityByDay: { name: string; total: number }[];
    languages: { name: string; value: number; color: string; icon: string }[];
    projects: { name: string; value: number; hours: number }[];
    recentActivity: {
        id: string;
        project: string;
        language: string;
        file: string;
        editor: string | null;
        timestamp: Date;
        color: string;
        icon: string;
    }[];
    summary: {
        totalTime: string;
        totalTime24h: string;
        dailyAverage: string;
        topProject: string;
        topProject24h: string;
        topLanguage: string;
        topLanguage24h: string;
        topLanguageIcon?: string;
        topLanguageIcon24h?: string;
        isLive?: boolean;
        lastHeartbeatAt?: Date;
        percentGrowth?: number;
        currentStreak: number;
        longestStreak: number;
        xp: number;
        level: number;
        achievements: {
            id: string;
            slug: string;
            name: string;
            description: string;
            icon: string | null;
            unlockedAt?: Date;
            isUnlocked: boolean;
        }[];
    };
    editors: { name: string; value: number; color: string; icon: string }[];
    platforms: { name: string; value: number; color: string; icon: string }[];
    machines: { name: string; value: number; hours: number; color: string }[];
}

/**
 * Compute aggregated development activity statistics for a user in a given timezone.
 *
 * Produces localized summaries (activity by day, language and project breakdowns, recent activity,
 * editor/platform distributions, 24-hour and weekly metrics, growth, and streaks) constrained to
 * the requested date range.
 *
 * @param userId - The ID of the user to compute stats for
 * @param range - Time window to query: `"today"` (local day start → now), `"yesterday"` (local previous day),
 *   or `"all"`/undefined (last 14 days up to now)
 * @param timezone - IANA timezone identifier used to localize day boundaries (defaults to `"UTC"`)
 * @returns An object containing:
 *   - activityByDay: seven-day localized hour totals
 *   - languages: top language breakdowns (name, percent value, color, icon)
 *   - projects: top projects (name, percent value, hours)
 *   - recentActivity: up to 10 most recent heartbeats with metadata and styling
 *   - editors: editor distribution (name, percent value, color, icon)
 *   - platforms: platform distribution (name, percent value, color, icon)
 *   - summary: aggregated metrics including `totalTime`, `totalTime24h`, `dailyAverage`,
 *     `topProject`, `topProject24h`, `topLanguage`, `topLanguage24h`, `topLanguageIcon`,
 *     `topLanguageIcon24h`, `isLive`, `lastHeartbeatAt`, `percentGrowth`, `currentStreak`, and `longestStreak`
 */
export async function calculateUserStats(userId: string, range?: "today" | "all" | "yesterday", timezone: string = "UTC"): Promise<Stats> {
    const now = new Date();
    // Get the current time in the user's timezone
    const zonedNow = new TZDate(now, timezone);

    // Calculate the start of "today" in the user's timezone
    const zonedTodayStart = startOfDay(zonedNow);

    let startDate: Date;
    let endDate: Date = now;
    if (range === "today") {
        startDate = zonedTodayStart;
    } else if (range === "yesterday") {
        startDate = subDays(zonedTodayStart, 1);
        endDate = zonedTodayStart;
    } else {
        startDate = subDays(zonedTodayStart, 14); // Fetch 14 days for growth comparison
    }

    // Fetch user with gamification data
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            achievements: {
                include: {
                    achievement: true
                },
                orderBy: { unlockedAt: 'desc' }
            }
        }
    });

    if (!user) {
        throw new Error("User not found");
    }

    // Fetch heartbeats
    const allHeartbeats = await prisma.heartbeat.findMany({
        where: {
            userId,
            timestamp: {
                gte: startDate,
                lte: endDate,
            },
        },
    });

    // Helper to get local date string (YYYY-MM-DD) for a heartbeat in user's timezone
    const getLocalDateStr = (date: Date) => format(new TZDate(date, timezone), "yyyy-MM-dd");

    // Split heartbeats into current week and previous week (local time)
    const currentWeekStartLocal = subDays(zonedTodayStart, 6); // Last 7 days including today
    const heartbeats = allHeartbeats.filter(h => new TZDate(h.timestamp, timezone) >= currentWeekStartLocal);
    const prevWeekHeartbeats = allHeartbeats.filter(h => {
        const zoned = new TZDate(h.timestamp, timezone);
        return zoned >= subDays(currentWeekStartLocal, 7) && zoned < currentWeekStartLocal;
    });

    // 1. Activity by Day (Localized)
    const activityByDay = Array.from({ length: 7 }).map((_, i) => {
        const localDayDate = subDays(zonedTodayStart, 6 - i);
        const dayStr = format(localDayDate, "EEE");
        const dayStart = startOfDay(localDayDate);
        const dayEnd = new Date(dayStart.getTime() + 86400000);

        const dayHeartbeats = heartbeats.filter(h => {
            const zoned = new TZDate(h.timestamp, timezone);
            return zoned >= dayStart && zoned < dayEnd;
        });

        const hours = calculateDuration(dayHeartbeats);
        return { name: dayStr, total: parseFloat(hours.toFixed(1)) };
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
        .slice(0, 5)
        .map((p, i) => ({ ...p, color: getProjectColor(i) }));

    const topProject = projects[0]?.name || "None";
    const totalHoursVal = Math.floor(totalDuration);
    const remainingMinutes = Math.round((totalDuration - totalHoursVal) * 60);

    // 4. Recent Activity
    const recentActivity = heartbeats
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10)
        .map(h => ({
            id: h.id,
            project: h.project,
            language: h.language,
            file: h.file,
            editor: h.editor,
            timestamp: h.timestamp,
            color: getLanguageColor(h.language),
            icon: getLanguageIcon(h.language)
        }));

    const lastHeartbeat = recentActivity[0];
    const isLive = lastHeartbeat
        ? (now.getTime() - new Date(lastHeartbeat.timestamp).getTime()) < 15 * 60 * 1000
        : false;

    // 5. 24-Hour Specific Stats (Previous 24h from now in user's context)
    const dayAgoZoned = subDays(zonedNow, 1);
    const last24hHeartbeats = heartbeats.filter(h => new TZDate(h.timestamp, timezone) >= dayAgoZoned);

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
        percentGrowth = 100;
    }

    // Calculate Current & Longest Streak (Localized) - Restricted to last 365 days for scalability
    const streakStartDate = subDays(zonedTodayStart, 365);
    const streakHeartbeats = await prisma.heartbeat.findMany({
        where: {
            userId,
            timestamp: { gte: streakStartDate }
        },
        select: { timestamp: true },
        orderBy: { timestamp: 'desc' }
    });

    const activeDays = new Set(streakHeartbeats.map(h => format(new TZDate(h.timestamp, timezone), "yyyy-MM-dd")));
    const { current: currentStreak, longest: longestStreak } = calculateStreaks(activeDays, timezone);

    // 6. Editor Distribution
    const editorGroups = new Map<string, typeof heartbeats>();
    heartbeats.forEach(h => {
        const editor = h.editor;
        if (!editor || editor.toLowerCase() === "unknown") return;
        if (!editorGroups.has(editor)) editorGroups.set(editor, []);
        editorGroups.get(editor)!.push(h);
    });

    const editorDurations = Array.from(editorGroups.entries()).map(([name, hList]) => ({
        name,
        duration: calculateDuration(hList)
    }));

    const editors = editorDurations
        .map(ed => ({
            name: ed.name,
            value: totalDuration > 0 ? Math.round((ed.duration / totalDuration) * 100) : 0,
            color: getEditorColor(ed.name),
            icon: getEditorIcon(ed.name)
        }))
        .sort((a, b) => b.value - a.value);

    // 7. Platform Distribution
    const platformGroups = new Map<string, typeof heartbeats>();
    heartbeats.forEach(h => {
        const platform = h.platform;
        if (!platform || platform.toLowerCase() === "unknown") return;
        if (!platformGroups.has(platform)) platformGroups.set(platform, []);
        platformGroups.get(platform)!.push(h);
    });

    const platformDurations = Array.from(platformGroups.entries()).map(([name, hList]) => ({
        name,
        duration: calculateDuration(hList)
    }));

    const platforms = platformDurations
        .map(pd => ({
            name: pd.name,
            value: totalDuration > 0 ? Math.round((pd.duration / totalDuration) * 100) : 0,
            color: getPlatformColor(pd.name),
            icon: getPlatformIcon(pd.name)
        }))
        .sort((a, b) => b.value - a.value);

    // 8. Machine Distribution
    const machineGroups = new Map<string, typeof heartbeats>();
    heartbeats.forEach(h => {
        const machine = (h as any).machine;
        if (!machine) return;
        if (!machineGroups.has(machine)) machineGroups.set(machine, []);
        machineGroups.get(machine)!.push(h);
    });

    const machineDurations = Array.from(machineGroups.entries()).map(([name, hList]) => ({
        name,
        duration: calculateDuration(hList)
    }));

    const machines = machineDurations
        .map(md => ({
            name: md.name,
            value: totalDuration > 0 ? Math.round((md.duration / totalDuration) * 100) : 0,
            hours: parseFloat(md.duration.toFixed(1)),
            color: getMachineColor(md.name)
        }))
        .sort((a, b) => b.value - a.value);

    // 9. Achievements (Merged Locked + Unlocked)
    const allAchievements = await prisma.achievement.findMany({
        orderBy: { createdAt: 'asc' }
    });

    const userUnlockedSlugs = new Set(user.achievements.map(ua => ua.achievement.slug));
    const userUnlockedMap = new Map(user.achievements.map(ua => [ua.achievement.slug, ua.unlockedAt]));

    const mergedAchievements = allAchievements.map(a => ({
        id: a.id,
        slug: a.slug,
        name: a.name,
        description: a.description,
        icon: a.icon,
        isUnlocked: userUnlockedSlugs.has(a.slug),
        unlockedAt: userUnlockedMap.get(a.slug)
    }));

    return {
        activityByDay,
        languages,
        projects,
        recentActivity,
        editors,
        platforms,
        machines,
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
            currentStreak,
            longestStreak,
            xp: user.xp,
            level: user.level,
            achievements: mergedAchievements
        }
    };
}

export function getLanguageColor(lang: string): string {
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
        javascriptreact: "#61dafb",
        typescriptreact: "#61dafb",
        dotenv: "#ffd33d",
        xml: "#0060ac",
        jsonc: "#292929",
        json5: "#292929",
        terminal: "#4EC9B0",
        shellscript: "#89e051",
    };
    return colors[lang.toLowerCase()] || "#888888";
}

export function getLanguageIcon(lang: string): string {
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
        javascriptreact: "react",
        typescriptreact: "react",
        dotenv: "nodejs",
        xml: "html5",
        jsonc: "json",
    };

    const lower = lang.toLowerCase();

    // Special cases that don't have devicon entries
    const specialIcons: Record<string, string> = {
        terminal: "/icons/terminal.svg",
        shellscript: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bash/bash-original.svg",
        unknown: "/icons/code.svg",
    };
    if (specialIcons[lower]) return specialIcons[lower];

    const name = langMap[lower] || lower;
    return `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${name}/${name}-original.svg`;
}

export function getEditorColor(editor: string): string {
    const colors: Record<string, string> = {
        vscode: "#007ACC",
        "code-server": "#1A8CFF",
        cursor: "#7C3AED",
        windsurf: "#00C9A7",
        vscodium: "#2F80ED",
        theia: "#5B2D8E",
        gitpod: "#FFAE33",
        "claude-code": "#D97757",
        terminal: "#4EC9B0",
        external: "#6A9955",
        intellij: "#000000",
        sublime: "#FF9800",
        vim: "#019733",
        neovim: "#57A143",
        emacs: "#7B529E",
        unknown: "#888888",
    };
    return colors[editor.toLowerCase()] || "#888888";
}

export function getEditorIcon(editor: string): string {
    return ""; // Frontend handles icons locally
}

export function getPlatformColor(platform: string): string {
    const colors: Record<string, string> = {
        win32: "#0078D6",
        darwin: "#000000",
        linux: "#FCC624",
        unknown: "#888888",
    };
    return colors[platform.toLowerCase()] || "#888888";
}

export function getPlatformIcon(platform: string): string {
    return ""; // Frontend handles icons locally
}

const PROJECT_COLORS = [
    "#6366f1", "#f59e0b", "#10b981", "#ef4444",
    "#8b5cf6", "#06b6d4", "#f97316", "#ec4899",
];

export function getProjectColor(index: number): string {
    return PROJECT_COLORS[index % PROJECT_COLORS.length];
}

const MACHINE_COLORS = [
    "#007ACC", "#D97757", "#4EC9B0", "#C586C0",
    "#DCDCAA", "#569CD6", "#CE9178", "#6A9955",
    "#F44747", "#B5CEA8", "#9CDCFE", "#D7BA7D",
];

export function getMachineColor(machine: string): string {
    // Deterministic color based on machine name hash
    let hash = 0;
    for (let i = 0; i < machine.length; i++) {
        hash = ((hash << 5) - hash + machine.charCodeAt(i)) | 0;
    }
    return MACHINE_COLORS[Math.abs(hash) % MACHINE_COLORS.length];
}