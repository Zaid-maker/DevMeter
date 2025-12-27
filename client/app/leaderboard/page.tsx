"use client";

import { useState } from "react";
import useSWR from "swr";
import {
    Trophy,
    Medal,
    Clock,
    ChevronRight,
    Activity,
    Loader2,
    Crown,
    ArrowUp,
    BarChart3
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
    id: string;
    name: string;
    image: string | null;
    totalHours: number;
    topLanguage: {
        name: string;
        icon: string | null;
    };
}

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch leaderboard");
    return res.json();
};

export default function LeaderboardPage() {
    const [range, setRange] = useState("7d");
    const { data, isLoading } = useSWR<{ leaderboard: LeaderboardEntry[] }>(
        `/api/leaderboard?range=${range}`,
        fetcher,
        { refreshInterval: 300000 } // 5 minutes refresh
    );

    const leaderboard = data?.leaderboard || [];
    const topThree = leaderboard.slice(0, 3);
    const rest = leaderboard.slice(3);

    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary/30 selection:text-primary">
            {/* Background Atmosphere */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30">
                <div className="absolute top-[-10%] left-[20%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[20%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px]" />
            </div>

            <main className="relative z-10 p-6 md:p-8 pt-10 md:pt-16 max-w-7xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <Badge variant="outline" className="py-1 px-4 border-primary/20 bg-primary/5 text-primary">
                            <Trophy className="h-3 w-3 mr-2" /> Global Rankings
                        </Badge>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
                            Code <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-400 to-primary bg-[length:200%_auto] animate-gradient">Elites.</span>
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-xl font-medium">
                            Join the global elite. Compete with top developers and track your climb to the top.
                        </p>
                    </div>

                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-xl">
                        {[
                            { id: "7d", label: "7 Days" },
                            { id: "30d", label: "30 Days" },
                            { id: "all", label: "All Time" }
                        ].map((r) => (
                            <Button
                                key={r.id}
                                variant="ghost"
                                size="sm"
                                onClick={() => setRange(r.id)}
                                className={cn(
                                    "rounded-xl px-4 h-9 font-bold transition-all",
                                    range === r.id
                                        ? "bg-primary text-black hover:bg-primary/90"
                                        : "text-muted-foreground hover:bg-white/5 hover:text-white"
                                )}
                            >
                                {r.label}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Top 3 Podium Highlights */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
                    {isLoading ? (
                        [1, 2, 3].map(i => <Skeleton key={i} className="h-80 w-full rounded-[2.5rem]" />)
                    ) : (
                        <>
                            {/* 2nd Place */}
                            <div className="order-2 md:order-1 mt-0 md:mt-12">
                                {topThree[1] && <PodiumCard entry={topThree[1]} rank={2} />}
                            </div>
                            {/* 1st Place */}
                            <div className="order-1 md:order-2">
                                {topThree[0] && <PodiumCard entry={topThree[0]} rank={1} />}
                            </div>
                            {/* 3rd Place */}
                            <div className="order-3 md:order-3 mt-0 md:mt-20">
                                {topThree[2] && <PodiumCard entry={topThree[2]} rank={3} />}
                            </div>
                        </>
                    )}
                </section>

                {/* Rankings Table */}
                <Card className="bg-white/[0.02] border-white/5 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="p-8 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl font-black tracking-tight">Full Standings</CardTitle>
                                <CardDescription>The community ranking by coding intensity.</CardDescription>
                            </div>
                            <div className="bg-white/5 px-4 py-2 rounded-xl flex items-center gap-2 border border-white/10">
                                <Activity className="h-4 w-4 text-primary" />
                                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Live Pulse</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="px-8 py-5 text-left text-xs font-bold uppercase tracking-widest text-muted-foreground">Rank</th>
                                        <th className="px-8 py-5 text-left text-xs font-bold uppercase tracking-widest text-muted-foreground">Developer</th>
                                        <th className="px-8 py-5 text-left text-xs font-bold uppercase tracking-widest text-muted-foreground">Main Stack</th>
                                        <th className="px-8 py-5 text-right text-xs font-bold uppercase tracking-widest text-muted-foreground">Coding Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        [1, 2, 3, 4, 5].map(i => (
                                            <tr key={i} className="border-b border-white/5">
                                                <td colSpan={4} className="px-8 py-8"><Skeleton className="h-8 w-full" /></td>
                                            </tr>
                                        ))
                                    ) : (
                                        rest.map((entry, index) => (
                                            <tr key={entry.id} className="group hover:bg-white/[0.03] transition-colors border-b border-white/5 last:border-0">
                                                <td className="px-8 py-6 font-mono text-lg font-black italic text-muted-foreground transition-colors group-hover:text-white">
                                                    #{index + 4}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <Avatar className="h-10 w-10 border border-white/10">
                                                            <AvatarImage src={entry.image || ""} />
                                                            <AvatarFallback className="bg-white/10 font-bold uppercase">{entry.name[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="font-bold text-lg tracking-tight transition-colors group-hover:text-primary">{entry.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3 bg-white/5 w-fit px-3 py-1.5 rounded-xl border border-white/5">
                                                        {entry.topLanguage.icon && (
                                                            <img
                                                                src={entry.topLanguage.icon}
                                                                className="h-4 w-4 object-contain brightness-125 transition-transform group-hover:scale-110"
                                                                alt={entry.topLanguage.name}
                                                            />
                                                        )}
                                                        <span className="text-sm font-bold opacity-80">{entry.topLanguage.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-xl font-black tabular-nums">{entry.totalHours}h</span>
                                                        <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-60">Verified Hours</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                    {leaderboard.length === 0 && !isLoading && (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center gap-4 opacity-50">
                                                    <Activity className="h-12 w-12" />
                                                    <p className="font-bold">No activity recorded for this period.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

function PodiumCard({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
    const isFirst = rank === 1;
    const colors = {
        1: "from-yellow-400 via-yellow-200 to-yellow-600 shadow-yellow-500/20 shadow-2xl",
        2: "from-slate-300 via-slate-100 to-slate-500 shadow-slate-400/10 shadow-xl",
        3: "from-orange-400 via-orange-200 to-orange-700 shadow-orange-500/10 shadow-xl",
    };

    const icons = {
        1: <Crown className="h-8 w-8 text-yellow-500" />,
        2: <Medal className="h-8 w-8 text-slate-400" />,
        3: <Medal className="h-8 w-8 text-orange-600" />,
    };

    return (
        <div className={cn(
            "relative group rounded-[2.5rem] p-1 overflow-hidden transition-all duration-500 hover:scale-[1.02]",
            isFirst ? "bg-gradient-to-br from-primary via-blue-400 to-primary" : "bg-white/10"
        )}>
            <div className="bg-[#0a0a0a] rounded-[2.3rem] p-8 h-full flex flex-col items-center text-center space-y-6 relative overflow-hidden">
                {/* Visual Flair */}
                <div className={cn(
                    "absolute -top-12 -right-12 w-32 h-32 blur-[64px] rounded-full opacity-30 group-hover:opacity-60 transition-opacity",
                    isFirst ? "bg-primary" : "bg-white"
                )} />

                <div className="relative">
                    <Avatar className={cn(
                        "h-24 w-24 border-4",
                        isFirst ? "border-primary shadow-[0_0_30px_rgba(var(--primary-rgb),0.5)]" : "border-white/10"
                    )}>
                        <AvatarImage src={entry.image || ""} />
                        <AvatarFallback className="bg-white/5 text-2xl font-black">{entry.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-black rounded-2xl p-2 border border-white/10 shadow-xl">
                        {icons[rank as 1 | 2 | 3]}
                    </div>
                </div>

                <div className="space-y-1">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Rank #{rank}</p>
                    <h3 className="text-2xl font-black tracking-tighter truncate w-48">{entry.name}</h3>
                </div>

                <div className="flex items-center gap-4 bg-white/5 rounded-2xl p-4 w-full border border-white/5">
                    <div className="flex-1 space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Intensity</p>
                        <p className="text-2xl font-black tracking-tighter tabular-nums">{entry.totalHours}h</p>
                    </div>
                    <div className="w-px h-10 bg-white/10" />
                    <div className="flex-1 space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">Focus</p>
                        <div className="flex items-center justify-center gap-1.5">
                            {entry.topLanguage.icon && <img src={entry.topLanguage.icon} className="h-4 w-4 grayscale group-hover:grayscale-0 transition-all" alt="" />}
                            <span className="text-sm font-bold">{entry.topLanguage.name}</span>
                        </div>
                    </div>
                </div>

                {isFirst && (
                    <div className="bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest py-1.5 px-4 rounded-full border border-primary/20 animate-pulse">
                        Current Leader
                    </div>
                )}
            </div>
        </div>
    );
}
