import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { startOfDay, subDays } from "date-fns";

// Helper function to calculate duration in hours from heartbeats
// This matches the logic in stats/route.ts
const calculateDuration = (hList: any[]) => {
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
            totalSeconds += diff / 1000;
        } else {
            totalSeconds += HEARTBEAT_VAL / 1000;
        }
        lastTime = currentTime;
    }

    return totalSeconds / 3600;
};

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
        sql: "mysql",
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

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const range = searchParams.get("range") || "7d"; // 7d, 30d, all

    let startDate: Date | undefined;
    const now = new Date();

    if (range === "7d") {
        startDate = subDays(now, 7);
    } else if (range === "30d") {
        startDate = subDays(now, 30);
    } else if (range === "all") {
        startDate = undefined;
    }

    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                image: true,
                heartbeats: {
                    where: startDate ? {
                        timestamp: {
                            gte: startDate,
                        },
                    } : {},
                    select: {
                        timestamp: true,
                        language: true,
                    },
                },
            },
        });

        const leaderboard = users.map(user => {
            const duration = calculateDuration(user.heartbeats);

            // Find top language
            const langCounts = new Map<string, number>();
            user.heartbeats.forEach(h => {
                langCounts.set(h.language, (langCounts.get(h.language) || 0) + 1);
            });

            let topLanguage = "None";
            let maxCount = 0;
            langCounts.forEach((count, lang) => {
                if (count > maxCount) {
                    maxCount = count;
                    topLanguage = lang;
                }
            });

            return {
                id: user.id,
                name: user.name || "Anonymous",
                image: user.image,
                totalHours: parseFloat(duration.toFixed(1)),
                topLanguage: {
                    name: topLanguage,
                    icon: topLanguage !== "None" ? getLanguageIcon(topLanguage) : null
                }
            };
        })
            .filter(item => item.totalHours > 0)
            .sort((a, b) => b.totalHours - a.totalHours);

        return NextResponse.json({ leaderboard });
    } catch (error) {
        console.error("Leaderboard API error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
