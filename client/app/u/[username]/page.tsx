"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts";
import { Activity, Clock, Code, Layout, Loader2, TrendingUp, Flame, Calendar, Target, Trophy, Award, Star, Zap, Terminal, Monitor } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { getXPLvlProgress } from "@/lib/gamification";

interface PublicProfile {
    user: {
        name: string;
        username: string;
        image: string | null;
        createdAt: string;
        level: number;
        xp: number;
        githubUrl: string | null;
        linkedinUrl: string | null;
    };
    stats: {
        totalTime: string;
        topLanguage: string;
        topLanguageIcon?: string;
        topProject: string;
        languages: { name: string; value: number; color: string; icon: string }[];
        projects: { name: string; value: number; hours: number; color: string }[];
        editors: { name: string; value: number; color: string }[];
        platforms: { name: string; value: number; color: string }[];
        activityByDay: { name: string; total: number }[];
        achievements: {
            id: string;
            slug: string;
            name: string;
            description: string;
            icon: string | null;
            unlockedAt?: string;
            isUnlocked: boolean;
        }[];
    };
    contribution: {
        contributions: { date: string; count: number }[];
        streaks: { current: number; longest: number };
        summary: { totalHours: number; daysActive: number; averagePerDay: number };
    };
}

export default function PublicProfilePage() {
    const params = useParams();
    const username = params.username as string;
    const [data, setData] = useState<PublicProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch(`/api/public/stats/${username}`)
            .then((res) => {
                if (!res.ok) throw new Error(res.status === 404 ? "User not found" : "Failed to load profile");
                return res.json();
            })
            .then(setData)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [username]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[600px]">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse text-sm">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[600px] space-y-4">
                <div className="text-6xl">404</div>
                <h1 className="text-2xl font-bold">{error || "User not found"}</h1>
                <p className="text-muted-foreground">The profile <span className="font-mono">@{username}</span> does not exist.</p>
            </div>
        );
    }

    const { user, stats, contribution } = data;
    const userInitial = user.name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "DM";
    const xpProgress = getXPLvlProgress(user.xp);
    const unlockedCount = stats.achievements.filter((a) => a.isUnlocked).length;

    return (
        <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 max-w-6xl mx-auto">
            {/* Profile Header */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-purple-600/20 rounded-3xl blur opacity-25"></div>
                <div className="relative flex flex-col md:flex-row items-center gap-8 bg-card/50 backdrop-blur-xl border border-white/5 p-8 rounded-3xl">
                    <div className="relative">
                        <div className="absolute -inset-2 bg-gradient-to-tr from-primary to-purple-600 rounded-full blur-sm opacity-30"></div>
                        <Avatar className="h-28 w-28 border-4 border-background ring-2 ring-primary/20">
                            <AvatarImage src={user.image || ""} alt={user.name} />
                            <AvatarFallback className="text-3xl font-black bg-primary/10 text-primary">{userInitial}</AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="flex-1 text-center md:text-left space-y-3">
                        <div className="space-y-1">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{user.name}</h1>
                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-2 py-0 h-6 flex items-center gap-1 font-bold">
                                    <Trophy className="h-3 w-3" />
                                    Level {user.level}
                                </Badge>
                            </div>
                            <p className="text-muted-foreground font-mono text-sm">@{user.username}</p>
                        </div>
                        <div className="flex flex-col gap-1 w-full max-w-md mx-auto md:mx-0">
                            <div className="flex justify-between text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                <span>XP Progress</span>
                                <span>{xpProgress.currentLevelXp} / {xpProgress.nextLevelXp} XP</span>
                            </div>
                            <Progress value={xpProgress.progress} className="h-1.5 bg-muted/30" />
                        </div>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4 text-primary" />
                                Joined {format(new Date(user.createdAt), "MMMM yyyy")}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Flame className="h-4 w-4 text-orange-400" />
                                {contribution.streaks.current}d streak
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Trophy className="h-4 w-4 text-yellow-400" />
                                {unlockedCount} achievement{unlockedCount !== 1 ? "s" : ""}
                            </span>
                        </div>
                        {(user.githubUrl || user.linkedinUrl) && (
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
                                {user.githubUrl && (
                                    <a
                                        href={user.githubUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium"
                                    >
                                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                                        GitHub
                                    </a>
                                )}
                                {user.linkedinUrl && (
                                    <a
                                        href={user.linkedinUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium"
                                    >
                                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                                        LinkedIn
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="hidden lg:flex flex-col gap-4">
                        <div className="bg-white/5 border border-white/5 p-4 rounded-2xl backdrop-blur-md text-center">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Coding Time</p>
                            <p className="text-xl font-black text-primary">{stats.totalTime}</p>
                        </div>
                        <div className="bg-white/5 border border-white/5 p-4 rounded-2xl backdrop-blur-md text-center">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Top Language</p>
                            <p className="text-xl font-black">{stats.topLanguage}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Coding" value={stats.totalTime} subtitle="Last 7 days" icon={Clock} />
                <StatCard title="Top Language" value={stats.topLanguage} subtitle="Most used" icon={Code} logo={stats.topLanguageIcon} />
                <StatCard title="Current Streak" value={`${contribution.streaks.current}d`} subtitle={`Best: ${contribution.streaks.longest}d`} icon={Flame} />
                <StatCard title="Days Active" value={`${contribution.summary.daysActive}`} subtitle={`${contribution.summary.averagePerDay}h/day avg`} icon={Target} />
            </div>

            {/* Activity Chart */}
            <Card className="shadow-sm border-muted/60 overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-8">
                    <div className="space-y-1">
                        <CardTitle>Activity Pulse</CardTitle>
                        <CardDescription>Daily coding intensity for the past week</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-primary" />
                        <span className="text-xs font-medium">Coding Hours</span>
                    </div>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={stats.activityByDay}>
                            <defs>
                                <linearGradient id="publicBarGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}h`} />
                            <RechartsTooltip
                                cursor={{ fill: "rgba(255,255,255,0.03)" }}
                                contentStyle={{ backgroundColor: "#111", border: "1px solid #333", borderRadius: "8px" }}
                                itemStyle={{ color: "#fff" }}
                            />
                            <Bar dataKey="total" fill="url(#publicBarGradient)" radius={[6, 6, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Contribution Heatmap */}
            <Card className="shadow-sm border-muted/60">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            Contribution Map
                        </CardTitle>
                        <CardDescription>Coding activity over the past year</CardDescription>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5">
                            <Flame className="h-4 w-4 text-orange-400" />
                            <span className="font-bold">{contribution.streaks.current}d</span>
                            <span className="text-muted-foreground text-xs">streak</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Trophy className="h-4 w-4 text-yellow-400" />
                            <span className="font-bold">{contribution.streaks.longest}d</span>
                            <span className="text-muted-foreground text-xs">best</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <ContributionHeatmap data={contribution.contributions} />
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                                <span>Less</span>
                                {[0, 0.25, 0.75, 2, 5, 7].map((v) => (
                                    <div key={v} className={`h-[10px] w-[10px] rounded-[2px] border ${getLevelColor(v)}`} />
                                ))}
                                <span>More</span>
                            </div>
                            <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-mono">
                                <span><strong className="text-foreground">{contribution.summary.totalHours.toFixed(0)}h</strong> total</span>
                                <span><strong className="text-foreground">{contribution.summary.daysActive}</strong> days active</span>
                                <span><strong className="text-foreground">{contribution.summary.averagePerDay.toFixed(1)}h</strong>/day avg</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Languages & Projects */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Languages Donut */}
                <Card className="shadow-sm border-muted/60">
                    <CardHeader>
                        <CardTitle>Languages</CardTitle>
                        <CardDescription>Tech stack distribution</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center">
                            <div className="relative w-full" style={{ height: 220 }}>
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie
                                            data={stats.languages}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={55}
                                            outerRadius={85}
                                            paddingAngle={3}
                                            strokeWidth={0}
                                            animationDuration={800}
                                        >
                                            {stats.languages.map((lang, i) => (
                                                <Cell key={i} fill={lang.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip
                                            contentStyle={{ backgroundColor: "#111", border: "1px solid #333", borderRadius: "8px" }}
                                            itemStyle={{ color: "#fff" }}
                                            formatter={(value: number, name: string) => [`${value}%`, name]}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="text-center">
                                        <p className="text-xl font-black">{stats.languages[0]?.value || 0}%</p>
                                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{stats.languages[0]?.name || ""}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-wrap justify-center gap-3 mt-2">
                                {stats.languages.map((lang) => (
                                    <div key={lang.name} className="flex items-center gap-1.5">
                                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: lang.color }} />
                                        <span className="text-xs text-muted-foreground font-medium">{lang.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Projects Donut */}
                <Card className="shadow-sm border-muted/60">
                    <CardHeader>
                        <CardTitle>Projects</CardTitle>
                        <CardDescription>Time distribution across workspaces</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center">
                            <div className="relative w-full" style={{ height: 220 }}>
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie
                                            data={stats.projects}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={55}
                                            outerRadius={85}
                                            paddingAngle={3}
                                            strokeWidth={0}
                                            animationDuration={800}
                                        >
                                            {stats.projects.map((project, i) => (
                                                <Cell key={i} fill={project.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip
                                            contentStyle={{ backgroundColor: "#111", border: "1px solid #333", borderRadius: "8px" }}
                                            itemStyle={{ color: "#fff" }}
                                            formatter={(value: number, name: string) => {
                                                const proj = stats.projects.find((p) => p.name === name);
                                                return [`${value}% (${proj?.hours || 0}h)`, name];
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="text-center">
                                        <p className="text-xl font-black">
                                            {stats.projects.reduce((sum, p) => sum + p.hours, 0).toFixed(1)}h
                                        </p>
                                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Total</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-wrap justify-center gap-3 mt-2">
                                {stats.projects.map((project) => (
                                    <div key={project.name} className="flex items-center gap-1.5">
                                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: project.color }} />
                                        <span className="text-xs text-muted-foreground font-medium">{project.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Achievements */}
            {stats.achievements.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold tracking-tight">Achievements</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {stats.achievements.map((achievement) => (
                            <Card
                                key={achievement.id}
                                className={`relative overflow-hidden transition-all duration-300 ${achievement.isUnlocked
                                    ? "border-primary/20 bg-primary/5"
                                    : "border-muted/40 bg-muted/5 opacity-60"
                                    }`}
                            >
                                <CardContent className="flex items-center gap-4 p-4">
                                    <div className={`text-4xl ${achievement.isUnlocked ? "" : "grayscale opacity-30"}`}>
                                        {achievement.icon || "🏆"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-bold text-sm flex items-center gap-1.5 ${!achievement.isUnlocked && "text-muted-foreground"}`}>
                                            {achievement.name}
                                            {achievement.isUnlocked && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">{achievement.description}</p>
                                        {achievement.isUnlocked && achievement.unlockedAt && (
                                            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                                                <Award className="h-3 w-3" />
                                                {new Date(achievement.unlockedAt).toLocaleDateString(undefined, {
                                                    month: "short", day: "numeric", year: "numeric",
                                                })}
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="text-center py-8 border-t border-white/5">
                <p className="text-xs text-muted-foreground">
                    Powered by <a href="/" className="text-primary font-bold hover:underline">DevMeter</a> — Automatic Coding Time Tracker
                </p>
            </div>
        </div>
    );
}

function StatCard({ title, value, subtitle, icon: Icon, logo }: {
    title: string;
    value: string;
    subtitle: string;
    icon: any;
    logo?: string;
}) {
    return (
        <Card className="relative overflow-hidden group border-muted/60 hover:border-primary/50 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors">{title}</CardTitle>
                <div className="p-2 rounded-lg bg-primary/5 h-8 w-8 flex items-center justify-center">
                    {logo ? (
                        <img src={logo} alt={title} className="h-4 w-4 object-contain" style={{ filter: "brightness(1.2) saturate(1.2)" }} />
                    ) : (
                        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold tracking-tighter">{value}</div>
                <p className="text-xs text-muted-foreground font-medium">{subtitle}</p>
            </CardContent>
        </Card>
    );
}

function getLevelColor(count: number): string {
    if (count === 0) return "bg-[#1b2130] border-[#2d3548]";
    if (count < 0.5) return "bg-primary/20 border-primary/25";
    if (count < 1) return "bg-primary/35 border-primary/35";
    if (count < 3) return "bg-primary/55 border-primary/45";
    if (count < 6) return "bg-primary/80 border-primary/55";
    return "bg-primary border-primary shadow-[0_0_6px_rgba(var(--primary-rgb),0.4)]";
}

function ContributionHeatmap({ data }: { data: { date: string; count: number }[] }) {
    const today = new Date();
    const dataMap = new Map(data.map((d) => [d.date, d.count]));

    const todayDow = today.getDay();
    const startDate = subDays(today, 364 + todayDow);
    const allDays = eachDayOfInterval({ start: startDate, end: today });

    const weeks: (Date | null)[][] = [];
    let col: (Date | null)[] = [];

    allDays.forEach((day) => {
        if (col.length === 7) {
            weeks.push(col);
            col = [];
        }
        col.push(day);
    });
    while (col.length < 7) col.push(null);
    if (col.length > 0) weeks.push(col);

    const months: { label: string; colIdx: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, i) => {
        const firstDay = week.find((d) => d !== null);
        if (firstDay && firstDay.getMonth() !== lastMonth) {
            lastMonth = firstDay.getMonth();
            months.push({ label: format(firstDay, "MMM"), colIdx: i });
        }
    });

    return (
        <div className="w-full overflow-x-auto pb-1">
            <div className="flex mb-1.5" style={{ paddingLeft: 36 }}>
                {weeks.map((_, i) => {
                    const m = months.find((m) => m.colIdx === i);
                    return (
                        <div key={i} className="flex-shrink-0" style={{ width: 14 }}>
                            {m && <span className="text-[10px] font-medium text-muted-foreground/70 select-none">{m.label}</span>}
                        </div>
                    );
                })}
            </div>
            <div className="flex gap-0">
                <div className="flex flex-col flex-shrink-0" style={{ width: 32, gap: 3 }}>
                    {["", "Mon", "", "Wed", "", "Fri", ""].map((label, i) => (
                        <div key={i} className="flex items-center" style={{ height: 11 }}>
                            <span className="text-[9px] font-medium text-muted-foreground/60 select-none leading-none">{label}</span>
                        </div>
                    ))}
                </div>
                <div className="flex" style={{ gap: 3 }}>
                    {weeks.map((week, colIdx) => (
                        <div key={colIdx} className="flex flex-col" style={{ gap: 3 }}>
                            {week.map((day, rowIdx) => {
                                if (!day) return <div key={rowIdx} style={{ width: 11, height: 11 }} />;
                                const dateStr = format(day, "yyyy-MM-dd");
                                const count = dataMap.get(dateStr) || 0;
                                return (
                                    <TooltipProvider key={rowIdx} delayDuration={0}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div
                                                    className={`rounded-[2px] border cursor-pointer hover:ring-1 hover:ring-primary/60 hover:scale-[1.3] transition-transform ${getLevelColor(count)}`}
                                                    style={{ width: 11, height: 11 }}
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent side="top" className="bg-[#0d1117] border-[#30363d] rounded-md px-2.5 py-1.5 text-center">
                                                <p className="text-[11px] font-semibold text-white">
                                                    {count > 0 ? `${count.toFixed(1)} hours` : "No activity"}
                                                </p>
                                                <p className="text-[10px] text-[#8b949e]">{format(day, "EEEE, MMM d, yyyy")}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
