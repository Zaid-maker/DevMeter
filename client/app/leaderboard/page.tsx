"use client";

import { useState, memo } from "react";
import useSWR from "swr";
import {
    Trophy,
    Medal,
    Activity,
    Crown,
    ArrowUp,
    Sparkles,
    Users
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
};

export default function LeaderboardPage() {
    const [range, setRange] = useState("7d");
    const { data, isLoading } = useSWR<{ leaderboard: LeaderboardEntry[] }>(
        `/api/leaderboard?range=${range}`,
        fetcher,
        {
            refreshInterval: 300000,
            revalidateOnFocus: false, // Optimized for performance
            revalidateOnReconnect: false,
            dedupingInterval: 60000
        }
    );

    const leaderboard = data?.leaderboard || [];
    const topThree = leaderboard.slice(0, 3);
    const rest = leaderboard.slice(3);

    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary/30 selection:text-primary">
            {/* Optimized Background Atmosphere */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.15, 1],
                        opacity: [0.25, 0.35, 0.25],
                    }}
                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[-10%] left-[20%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] will-change-transform"
                />
                <motion.div
                    animate={{
                        scale: [1.15, 1, 1.15],
                        opacity: [0.15, 0.25, 0.15],
                    }}
                    transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-[-10%] right-[20%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] will-change-transform"
                />
            </div>

            <motion.main
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="relative z-10 p-4 md:p-8 pt-10 md:pt-16 max-w-7xl mx-auto space-y-12"
            >
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <motion.div variants={itemVariants} className="space-y-4">
                        <Badge variant="outline" className="py-1 px-4 border-primary/20 bg-primary/5 text-primary backdrop-blur-md">
                            <Trophy className="h-3.5 w-3.5 mr-2" />
                            <span className="font-bold tracking-tight">GLOBAL RANKINGS</span>
                        </Badge>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
                            Code <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-400 to-primary bg-[length:200%_auto] animate-gradient">Elites.</span>
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-xl font-medium leading-relaxed">
                            Ascend the leaderboard. Compete with the most focused engineers globally and claim your spot at the peak.
                        </p>
                    </motion.div>

                    <motion.div
                        variants={itemVariants}
                        className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-2xl shadow-2xl"
                    >
                        {[
                            { id: "7d", label: "7 DAYS" },
                            { id: "30d", label: "30 DAYS" },
                            { id: "all", label: "ALL TIME" }
                        ].map((r) => (
                            <Button
                                key={r.id}
                                variant="ghost"
                                size="sm"
                                onClick={() => setRange(r.id)}
                                className={cn(
                                    "rounded-xl px-6 h-10 font-black text-[10px] tracking-widest transition-all duration-300",
                                    range === r.id
                                        ? "bg-primary text-black hover:bg-primary/90 shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)]"
                                        : "text-muted-foreground hover:bg-white/5 hover:text-white"
                                )}
                            >
                                {r.label}
                            </Button>
                        ))}
                    </motion.div>
                </div>

                {/* Top 3 Podium Highlights */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
                    <AnimatePresence mode="popLayout">
                        {isLoading ? (
                            [1, 2, 3].map(i => (
                                <div key={`skeleton-${i}`} className="h-96 w-full">
                                    <Skeleton className="h-full w-full rounded-[3rem] bg-white/5" />
                                </div>
                            ))
                        ) : (
                            <>
                                <motion.div
                                    key={`podium-2-${range}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4 }}
                                    className="order-2 md:order-1 mt-0 md:mt-12"
                                >
                                    {topThree[1] && <PodiumCard entry={topThree[1]} rank={2} />}
                                </motion.div>

                                <motion.div
                                    key={`podium-1-${range}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.1 }}
                                    className="order-1 md:order-2"
                                >
                                    {topThree[0] && <PodiumCard entry={topThree[0]} rank={1} />}
                                </motion.div>

                                <motion.div
                                    key={`podium-3-${range}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.2 }}
                                    className="order-3 md:order-3 mt-0 md:mt-24"
                                >
                                    {topThree[2] && <PodiumCard entry={topThree[2]} rank={3} />}
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </section>

                {/* Rankings Table */}
                <motion.div variants={itemVariants}>
                    <Card className="bg-white/[0.03] border-white/5 backdrop-blur-3xl rounded-[3rem] overflow-hidden shadow-2xl relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5 pointer-events-none" />
                        <CardHeader className="p-10 pb-6 relative z-10">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                <div>
                                    <CardTitle className="text-3xl font-black tracking-tighter mb-1">Elite Standings</CardTitle>
                                    <CardDescription className="text-base font-medium">Monitoring global developer intensity in real-time.</CardDescription>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/10 shadow-inner">
                                        <Users className="h-4 w-4 text-primary" />
                                        <span className="text-xs font-bold uppercase tracking-widest text-primary/80">Active Coders</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white/5 px-5 py-2.5 rounded-2xl border border-white/10 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-primary/10 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground relative z-10">LIVE PULSE</span>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 relative z-10">
                            <div className="overflow-x-auto no-scrollbar">
                                <table className="w-full min-w-[800px]">
                                    <thead>
                                        <tr className="border-b border-white/5">
                                            <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">Position</th>
                                            <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">Engineering Profile</th>
                                            <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">Primary Vector</th>
                                            <th className="px-10 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">Intensity Score</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {isLoading ? (
                                            [1, 2, 3, 4, 5].map(i => (
                                                <tr key={`skel-row-${i}`} className="border-b border-white/5">
                                                    <td colSpan={4} className="px-10 py-10"><Skeleton className="h-12 w-full bg-white/5 rounded-2xl" /></td>
                                                </tr>
                                            ))
                                        ) : (
                                            rest.map((entry, index) => (
                                                <LeaderboardRow key={entry.id} entry={entry} index={index + 3} />
                                            ))
                                        )}
                                        {leaderboard.length === 0 && !isLoading && (
                                            <tr>
                                                <td colSpan={4} className="px-10 py-32 text-center">
                                                    <div className="flex flex-col items-center gap-6 opacity-30">
                                                        <Activity className="h-20 w-20 stroke-1" />
                                                        <div className="space-y-2">
                                                            <p className="text-2xl font-black tracking-tighter">Zero Static Signal.</p>
                                                            <p className="text-sm font-medium">No system activity detected for this temporal range.</p>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.main>
        </div>
    );
}

// Memoized Table Row for better performance
const LeaderboardRow = memo(({ entry, index }: { entry: LeaderboardEntry; index: number }) => (
    <motion.tr
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.02, duration: 0.3 }}
        className="group hover:bg-white/[0.04] transition-all duration-300 will-change-transform"
    >
        <td className="px-10 py-8">
            <span className="font-mono text-2xl font-black italic text-muted-foreground/30 group-hover:text-primary/50 transition-colors">
                #{index + 1}
            </span>
        </td>
        <td className="px-10 py-8">
            <div className="flex items-center gap-5">
                <div className="relative group/avatar">
                    <div className="absolute -inset-0.5 bg-gradient-to-tr from-primary to-blue-500 rounded-full blur opacity-0 group-hover/avatar:opacity-40 transition duration-500" />
                    <Avatar className="h-14 w-14 border-2 border-white/10 relative p-0.5 bg-black">
                        <AvatarImage src={entry.image || ""} className="rounded-full" />
                        <AvatarFallback className="bg-white/5 font-black uppercase text-lg">{entry.name[0]}</AvatarFallback>
                    </Avatar>
                </div>
                <div className="flex flex-col text-left">
                    <span className="font-black text-xl tracking-tighter group-hover:text-primary transition-colors">{entry.name}</span>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">Verified Developer</span>
                </div>
            </div>
        </td>
        <td className="px-10 py-8">
            <div className="flex items-center gap-3 bg-white/5 w-fit px-5 py-2.5 rounded-2xl border border-white/10 group-hover:bg-primary/5 group-hover:border-primary/20 transition-all duration-300">
                {entry.topLanguage.icon && (
                    <img
                        src={entry.topLanguage.icon}
                        className="h-5 w-5 object-contain brightness-125 transition-transform group-hover:scale-110 group-hover:rotate-6 duration-500"
                        alt={entry.topLanguage.name}
                    />
                )}
                <span className="text-sm font-black tracking-tight opacity-90">{entry.topLanguage.name}</span>
            </div>
        </td>
        <td className="px-10 py-8 text-right">
            <div className="flex flex-col items-end">
                <div className="flex items-center gap-2 group/score">
                    <ArrowUp className="h-3.5 w-3.5 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="text-3xl font-black tabular-nums tracking-tighter">{entry.totalHours}h</span>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground opacity-40">Cumulative Focus</span>
            </div>
        </td>
    </motion.tr>
));

LeaderboardRow.displayName = "LeaderboardRow";

// Memoized Podium Card for performance
const PodiumCard = memo(({ entry, rank }: { entry: LeaderboardEntry; rank: number }) => {
    const isFirst = rank === 1;

    const rankConfig = {
        1: {
            icon: <Crown className="h-10 w-10 text-yellow-500" />,
            glow: "from-primary/40 to-blue-500/40",
            label: "CHAMPION",
            border: "border-primary/40"
        },
        2: {
            icon: <Medal className="h-9 w-9 text-slate-400" />,
            glow: "from-slate-400/20 to-transparent",
            label: "ELITE II",
            border: "border-slate-500/20"
        },
        3: {
            icon: <Medal className="h-8 w-8 text-orange-600" />,
            glow: "from-orange-600/20 to-transparent",
            label: "ELITE III",
            border: "border-orange-600/20"
        }
    };

    const config = rankConfig[rank as 1 | 2 | 3];

    return (
        <div className={cn(
            "relative group rounded-[3.5rem] p-1 overflow-hidden transition-all duration-700 will-change-transform",
            isFirst ? "bg-gradient-to-br from-primary via-blue-500 to-primary/50 p-1.5 shadow-[0_0_50px_rgba(var(--primary-rgb),0.2)] hover:shadow-[0_0_80px_rgba(var(--primary-rgb),0.4)]" : "bg-white/10 hover:bg-white/15"
        )}>
            <div className="bg-black/95 rounded-[3.4rem] p-10 h-full flex flex-col items-center text-center space-y-8 relative overflow-hidden">
                <div className={cn(
                    "absolute -top-20 -right-20 w-48 h-48 blur-[80px] rounded-full opacity-20 group-hover:opacity-40 transition-all duration-1000 bg-gradient-to-br",
                    config.glow
                )} />

                <div className="relative group/avatar">
                    <motion.div
                        initial={false}
                        whileHover={{ scale: 1.05, rotate: 2 }}
                        className="relative"
                    >
                        <div className={cn(
                            "absolute -inset-1 rounded-full blur-md opacity-0 group-hover:opacity-100 transition duration-500 bg-gradient-to-tr",
                            isFirst ? "from-primary to-yellow-400" : "from-white to-transparent"
                        )} />
                        <Avatar className={cn(
                            "h-32 w-32 border-[6px] relative z-10 p-1 bg-black",
                            isFirst ? "border-primary" : "border-white/10"
                        )}>
                            <AvatarImage src={entry.image || ""} className="rounded-full" />
                            <AvatarFallback className="bg-white/5 text-4xl font-black">{entry.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-black rounded-[1.2rem] p-3 border-2 border-white/10 shadow-2xl z-20">
                            {config.icon}
                        </div>
                    </motion.div>
                </div>

                <div className="space-y-2 pt-2">
                    <p className={cn(
                        "text-[10px] font-black uppercase tracking-[0.4em] mb-2",
                        isFirst ? "text-primary" : "text-muted-foreground"
                    )}>{config.label}</p>
                    <h3 className="text-3xl font-black tracking-tighter truncate w-56 group-hover:scale-105 transition-transform duration-500">{entry.name}</h3>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full relative z-10">
                    <div className="bg-white/5 backdrop-blur-md rounded-3xl p-5 border border-white/10 hover:border-white/20 transition-colors group/stat">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 opacity-60">Intensity</p>
                        <div className="flex items-center justify-center gap-1">
                            {isFirst && <Sparkles className="h-3 w-3 text-primary animate-pulse" />}
                            <p className="text-2xl font-black tracking-tighter tabular-nums">{entry.totalHours}h</p>
                        </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-md rounded-3xl p-5 border border-white/10 hover:border-white/20 transition-colors">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 opacity-60">Core Focus</p>
                        <div className="flex items-center justify-center gap-2">
                            {entry.topLanguage.icon && (
                                <img
                                    src={entry.topLanguage.icon}
                                    className="h-4 w-4 grayscale brightness-200 group-hover:grayscale-0 transition-all duration-700"
                                    alt=""
                                />
                            )}
                            <span className="text-sm font-black tracking-tight">{entry.topLanguage.name}</span>
                        </div>
                    </div>
                </div>

                {isFirst && (
                    <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.3em] py-2 px-8 rounded-full border-2 border-primary/20"
                    >
                        UNSTOPPABLE
                    </motion.div>
                )}
            </div>
        </div>
    );
});

PodiumCard.displayName = "PodiumCard";
