"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { Activity, Clock, Code, Layout, Key, Copy, Plus, RefreshCw, Loader2, Zap, ArrowUpRight, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import useSWR from "swr";
import { useRouter } from "next/navigation";

interface Stats {
    activityByDay: { name: string; total: number }[];
    languages: { name: string; value: number; color: string; icon: string }[];
    projects: { name: string; value: number; hours: number }[];
    recentActivity: {
        id: string;
        project: string;
        language: string;
        file: string;
        timestamp: string;
        color: string;
        icon: string;
    }[];
    summary: {
        totalTime: string;
        dailyAverage: string;
        topProject: string;
        topLanguage: string;
        topLanguageIcon?: string;
        isLive?: boolean;
        lastHeartbeatAt?: string;
        percentGrowth?: number;
    };
}

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const errorText = !errorData ? await res.text().catch(() => "Unknown error") : null;
        const error = new Error(errorData?.message || errorText || "An error occurred while fetching the data.");
        (error as any).status = res.status;
        (error as any).info = errorData;
        throw error;
    }
    return res.json();
};

export default function DashboardPage() {
    const { data: session, isPending: isAuthPending } = authClient.useSession();
    const { data: stats, isLoading } = useSWR<Stats>(
        session ? "/api/stats" : null,
        fetcher,
        { refreshInterval: 60000 } // Refresh every minute
    );
    const router = useRouter()

    if (isAuthPending) {
        return (
            <div className="flex items-center justify-center min-h-[600px]">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse text-sm">Synchronizing your statistics...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        router.replace("/auth/sign-in");
        return null;
    }

    return (
        <div className="flex-1 space-y-8 p-8 pt-6 max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-4xl font-extrabold tracking-tight">Bonjour, {session.user.name?.split(' ')[0]}</h2>
                    <p className="text-muted-foreground flex items-center">
                        {stats?.summary.percentGrowth !== undefined && (
                            <>
                                {stats.summary.percentGrowth >= 0 ? (
                                    <TrendingUp className="mr-2 h-4 w-4 text-green-500" />
                                ) : (
                                    <TrendingUp className="mr-2 h-4 w-4 text-red-500 transform rotate-180" />
                                )}
                                Your coding output is {stats.summary.percentGrowth >= 0 ? 'up' : 'down'} {Math.abs(stats.summary.percentGrowth)}% compared to last week.
                            </>
                        )}
                        {stats?.summary.percentGrowth === undefined && !isLoading && (
                            <>
                                <TrendingUp className="mr-2 h-4 w-4 text-primary opacity-50" />
                                Track your progress to see weekly insights.
                            </>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge
                        variant="secondary"
                        className={`px-3 py-1.5 border transition-all duration-500 ${stats?.summary.isLive
                            ? "bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20"
                            : "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"
                            }`}
                    >
                        <Activity className={`mr-2 h-4 w-4 ${stats?.summary.isLive ? "animate-pulse" : "opacity-50"}`} />
                        {stats?.summary.isLive ? "Extension Live" : "Extension Offline"}
                    </Badge>
                    <Button variant="outline" size="sm" className="hidden sm:flex">
                        Share Stats <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-8">
                <TabsList className="bg-muted/50 p-1">
                    <TabsTrigger value="overview" className="px-6">Overview</TabsTrigger>
                    <TabsTrigger value="projects" className="px-6">Projects</TabsTrigger>
                    <TabsTrigger value="languages" className="px-6">Languages</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-8">
                    {/* Quick Stats Grid */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <StatCard title="Coding Time" value={stats?.summary.totalTime} subtitle="Last 7 Days" icon={Clock} loading={isLoading} />
                        <StatCard title="Daily Mean" value={stats?.summary.dailyAverage} subtitle="Consistency Goal: 4h" icon={Activity} loading={isLoading} />
                        <StatCard title="Primary Target" value={stats?.summary.topProject} subtitle="Highest engagement" icon={Layout} loading={isLoading} />
                        <StatCard title="Main Stack" value={stats?.summary.topLanguage} subtitle="Primary language" icon={Code} logo={stats?.summary.topLanguageIcon} loading={isLoading} />
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-12">
                        {/* Main Chart */}
                        <Card className="lg:col-span-8 shadow-sm border-muted/60 overflow-hidden">
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
                                {isLoading ? (
                                    <Skeleton className="h-[350px] w-full" />
                                ) : (
                                    <ResponsiveContainer width="100%" height={350}>
                                        <BarChart data={stats?.activityByDay || []}>
                                            <defs>
                                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                                                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}h`} />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                                                itemStyle={{ color: '#fff' }}
                                            />
                                            <Bar dataKey="total" fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent Activity Feed */}
                        <Card className="lg:col-span-4 shadow-sm border-muted/60">
                            <CardHeader>
                                <CardTitle>Recent Activity</CardTitle>
                                <CardDescription>Real-time heartbeat logs</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="space-y-4">
                                        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                                    </div>
                                ) : (
                                    <ScrollArea className="h-[350px] pr-4">
                                        <div className="space-y-6">
                                            {stats?.recentActivity.map((activity) => (
                                                <div key={activity.id} className="flex items-start space-x-4">
                                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted/40 p-2.5 shadow-sm border border-muted/50 backdrop-blur-sm">
                                                        <img
                                                            src={activity.icon}
                                                            alt={activity.language}
                                                            className="h-full w-full object-contain"
                                                            style={{ filter: "brightness(1.2) saturate(1.3) drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }}
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                                (e.target as HTMLImageElement).parentElement!.style.backgroundColor = activity.color;
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="space-y-1 overflow-hidden">
                                                        <p className="text-sm font-semibold leading-none truncate">
                                                            {activity.project}
                                                            <span className="text-muted-foreground font-normal ml-2 opacity-80">({activity.language})</span>
                                                        </p>
                                                        <p className="text-xs text-muted-foreground truncate opacity-70">
                                                            {activity.file.split('/').pop()}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider opacity-60">
                                                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="projects" className="space-y-8">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Project Decomposition</CardTitle>
                            <CardDescription>Visualizing your efforts across workspace projects.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="space-y-8 py-4">
                                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                                </div>
                            ) : (
                                <div className="grid gap-8 py-4">
                                    {stats?.projects.map(project => (
                                        <div key={project.name} className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-lg">{project.name}</span>
                                                    <span className="text-xs text-muted-foreground uppercase tracking-widest">{project.hours} Hours tracked</span>
                                                </div>
                                                <Badge variant="outline" className="text-lg px-4 py-1.5 font-bold">{project.value}%</Badge>
                                            </div>
                                            <Progress value={project.value} className="h-3" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="languages" className="space-y-8">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Technological Stack</CardTitle>
                            <CardDescription>Language proficiency measured by total coding time.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-12 md:grid-cols-2 py-6">
                                <div className="space-y-6">
                                    {stats?.languages.map(lang => (
                                        <div key={lang.name} className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-muted/40 p-2 shadow-inner border border-muted/50 backdrop-blur-sm">
                                                        <img
                                                            src={lang.icon}
                                                            alt={lang.name}
                                                            className="h-full w-full object-contain"
                                                            style={{ filter: "brightness(1.2) saturate(1.3) drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }}
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                                (e.target as HTMLImageElement).parentElement!.style.backgroundColor = lang.color;
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="font-bold text-base">{lang.name}</span>
                                                </div>
                                                <span className="text-muted-foreground font-medium">{lang.value}%</span>
                                            </div>
                                            <Progress value={lang.value} className="h-2.5 rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.05)' }} />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center justify-center p-8 bg-muted/20 rounded-2xl border-2 border-dashed border-muted">
                                    <div className="text-center space-y-2">
                                        <TrendingUp className="h-12 w-12 text-primary mx-auto opacity-20" />
                                        <p className="text-sm font-medium">Stack Insights coming soon</p>
                                        <p className="text-xs text-muted-foreground max-w-xs">Detailed historical stack comparison and predictions will appear here.</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function StatCard({ title, value, subtitle, icon: Icon, logo, loading }: any) {
    return (
        <Card className="relative overflow-hidden group border-muted/60 hover:border-primary/50 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors">{title}</CardTitle>
                <div className="p-2 rounded-lg bg-primary/5 group-hover:bg-primary/10 transition-colors h-8 w-8 flex items-center justify-center">
                    {logo ? (
                        <img
                            src={logo}
                            alt={title}
                            className="h-4 w-4 object-contain transition-all duration-300"
                            style={{ filter: "brightness(1.2) saturate(1.2) drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}
                        />
                    ) : (
                        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <Skeleton className="h-8 w-24" />
                ) : (
                    <div className="space-y-1">
                        <div className="text-3xl font-bold tracking-tighter">{value || "0h 0m"}</div>
                        <p className="text-xs text-muted-foreground font-medium flex items-center">
                            {subtitle}
                        </p>
                    </div>
                )}
            </CardContent>
            <div className="absolute bottom-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                {logo ? (
                    <img
                        src={logo}
                        alt=""
                        className="h-12 w-12 object-contain"
                        style={{ filter: "brightness(1.1) saturate(1.1)" }}
                    />
                ) : (
                    <Icon className="h-12 w-12" />
                )}
            </div>
        </Card>
    );
}
