"use client";

import { useEffect, useState, Suspense } from "react";
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
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Mail, Star, Trophy, Award } from "lucide-react";
import { getXPLvlProgress } from "@/lib/gamification";

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
        totalTime24h: string;
        dailyAverage: string;
        topProject: string;
        topProject24h: string;
        topLanguage: string;
        topLanguage24h: string;
        topLanguageIcon?: string;
        topLanguageIcon24h?: string;
        percentGrowth?: number;
        currentStreak: number;
        xp: number;
        level: number;
        achievements: {
            id: string;
            slug: string;
            name: string;
            description: string;
            icon: string | null;
            unlockedAt: string;
        }[];
    };
    editors: { name: string; value: number; color: string; icon: string }[];
    platforms: { name: string; value: number; color: string; icon: string }[];
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

function DashboardContent() {
    const { data: session, isPending: isAuthPending } = authClient.useSession();
    const { data: stats, isLoading } = useSWR<Stats>(
        session ? "/api/stats" : null,
        fetcher,
        { refreshInterval: 60000 } // Refresh every minute
    );
    const router = useRouter()
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const activeTab = searchParams.get("tab") || "overview";

    const handleTabChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", value);
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const [sendingEmail, setSendingEmail] = useState(false);
    const [showVerificationDialog, setShowVerificationDialog] = useState(false);
    const [hasDismissed, setHasDismissed] = useState(false);

    // Timezone synchronization
    useEffect(() => {
        if (session?.user) {
            const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const storedTimezone = (session.user as any).timezone;

            if (browserTimezone && browserTimezone !== storedTimezone) {
                fetch("/api/user/timezone", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ timezone: browserTimezone }),
                }).catch(err => console.error("Failed to sync timezone:", err));
            }
        }
    }, [session?.user]);

    useEffect(() => {
        const isEmailVerified = session?.user?.emailVerified;
        if (session && isEmailVerified === false && !hasDismissed) {
            setShowVerificationDialog(true);
        }
    }, [session?.user?.emailVerified, hasDismissed, session]);

    const handleSendVerification = async () => {
        if (!session?.user.email) return;

        setSendingEmail(true);
        try {
            await authClient.sendVerificationEmail({
                email: session.user.email,
                callbackURL: window.location.href,
            });
            toast.success("Verification email sent!", {
                description: "Check your inbox for the verification link.",
            });
            setShowVerificationDialog(false);
        } catch (error: any) {
            toast.error("Failed to send verification email", {
                description: error.message || "Something went wrong.",
            });
        } finally {
            setSendingEmail(false);
        }
    };

    const getIconComponent = (name: string, type: 'editor' | 'platform') => {
        const lowerName = name.toLowerCase();

        if (type === 'editor') {
            if (lowerName.includes('vscode')) {
                return (
                    <img
                        src="/icons/vscode_nano.png"
                        alt="VS Code"
                        className="h-full w-full object-contain"
                        style={{ filter: "brightness(1.1) saturate(1.2)" }}
                    />
                );
            }
            if (lowerName.includes('intellij')) {
                return (
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full p-0.5">
                        <rect width="24" height="24" rx="4" fill="#000000" />
                        <path d="M18.8 19.2H5.2V16.4L10.8 4.8H18.8V19.2Z" fill="#FE2857" />
                        <path d="M18.8 4.8H5.2V13.2L13.2 19.2H18.8V4.8Z" fill="#3DDB85" />
                        <path d="M12 12H18.8V19.2H12V12Z" fill="#007ACC" />
                        <path d="M5.2 6.4H13.2V14.4H5.2V6.4Z" fill="#6B2CF5" />
                        <path d="M7 10H17V14H7V10Z" fill="white" opacity="0.9" />
                        <path d="M8 11.5H10V12.5H8V11.5ZM11 11.5H16V12.5H11V11.5Z" fill="black" />
                    </svg>
                );
            }
            return <Code className="h-4 w-4 text-primary" />;
        } else {
            if (lowerName.includes('win')) {
                return (
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
                        <path d="M3 5.47917L11.1714 4.34375V11.6042H3V5.47917ZM3 12.3958H11.1714V19.6562L3 18.5208V12.3958ZM12.1143 4.21146L21 3V11.6042H12.1143V4.21146ZM21 12.3958L12.1143 12.3958V19.7823L21 21V12.3958Z" fill="#00A4EF" />
                    </svg>
                );
            }
            if (lowerName.includes('darwin') || lowerName.includes('macos') || lowerName.includes('apple')) {
                return (
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
                        <path d="M17.05 20.28c-.96.7-1.84.91-2.61.91-.97 0-1.63-.26-2.18-.55-.55-.3-1.12-.59-2.07-.59-.95 0-1.55.3-2.1.59-.55.29-1.2.55-2.17.55-.77 0-1.65-.21-2.61-.91C2.17 17.53 1.05 12.28 3.55 8.35c.92-1.45 2.1-2.11 3.25-2.11.83 0 1.45.21 2 .46.56.25 1.14.51 1.95.51.81 0 1.39-.26 1.94-.51.55-.25 1.17-.46 2-.46 1.15 0 2.33.66 3.25 2.11 2.5 3.93 1.38 9.18-1.55 11.93l.06-.02zM14.63 2.18c.95.12 1.83.66 2.33 1.48.5 1.06.33 2.3-.39 3.09-.54.51-1.32.96-2.22.96-.9 0-1.58-.59-2.08-1.13-.5-.54-.92-1.3-.92-2.16 0-.86.6-1.74 1.48-2.11.23-.09.7-.13 1.8.13v-.26z" fill="currentColor" />
                    </svg>
                );
            }
            if (lowerName.includes('linux')) {
                return (
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
                        <path d="M12 2C9.5 2 7.5 4 7.5 6.5C7.5 7.8 8.1 9 9.1 9.8C7.3 10.8 6 12.8 6 15V18H18V15C18 12.8 16.7 10.8 14.9 9.8C15.9 9 16.5 7.8 16.5 6.5C16.5 4 14.5 2 12 2Z" fill="#FCC624" />
                        <path d="M11 15H13V16H11V15Z" fill="#333" />
                        <path d="M8 18C7 18 6 19 6 20V21H18V20C18 19 17 18 16 18H8Z" fill="#E95420" />
                    </svg>
                );
            }
            return <Activity className="h-4 w-4 text-primary" />;
        }
    };

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
        <div className="flex-1 space-y-6 md:space-y-8 p-4 md:p-8 pt-4 md:pt-6 max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3">
                    <div className="flex flex-col md:flex-row md:items-baseline gap-2">
                        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Bonjour, {session.user.name?.split(' ')[0]}</h2>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-2 py-0 h-6 flex items-center gap-1 font-bold">
                                <Trophy className="h-3 w-3" />
                                Level {stats?.summary.level || 1}
                            </Badge>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1 w-full max-w-md">
                        <div className="flex justify-between text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            <span>XP Progress</span>
                            <span>{stats ? `${getXPLvlProgress(stats.summary.xp).currentLevelXp} / ${getXPLvlProgress(stats.summary.xp).nextLevelXp} XP` : '0 / 0 XP'}</span>
                        </div>
                        <Progress
                            value={stats ? getXPLvlProgress(stats.summary.xp).progress : 0}
                            className="h-1.5 md:h-2 bg-muted/30"
                        />
                    </div>

                    <p className="text-sm md:text-base text-muted-foreground flex items-center">
                        {stats?.summary.percentGrowth !== undefined && (
                            <>
                                {stats.summary.percentGrowth >= 0 ? (
                                    <TrendingUp className="mr-2 h-4 w-4 text-green-500" />
                                ) : (
                                    <TrendingUp className="mr-2 h-4 w-4 text-red-500 transform rotate-180" />
                                )}
                                <span className="line-clamp-1">
                                    Your output is {stats.summary.percentGrowth >= 0 ? 'up' : 'down'} {Math.abs(stats.summary.percentGrowth)}% vs last week.
                                </span>
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
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    <Badge
                        variant="secondary"
                        className={`px-3 py-1.5 border transition-all duration-500 text-[10px] md:text-xs ${stats?.summary.isLive
                            ? "bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20"
                            : "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"
                            }`}
                    >
                        <Activity className={`mr-2 h-4 w-4 ${stats?.summary.isLive ? "animate-pulse" : "opacity-50"}`} />
                        {stats?.summary.isLive ? "Extension Live" : "Extension Offline"}
                    </Badge>
                    <Button
                        variant="outline"
                        size="sm"
                        className="hidden sm:flex rounded-lg h-9"
                        onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            toast.success("Stats link copied!", {
                                description: "You can now share your dashboard with others.",
                            });
                        }}
                    >
                        Share Stats <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6 md:space-y-8">
                <div className="w-full overflow-x-auto pb-1 no-scrollbar">
                    <TabsList className="bg-muted/50 p-1 w-full sm:w-auto flex">
                        <TabsTrigger value="overview" className="flex-1 sm:flex-none px-4 md:px-6">Overview</TabsTrigger>
                        <TabsTrigger value="projects" className="flex-1 sm:flex-none px-4 md:px-6">Projects</TabsTrigger>
                        <TabsTrigger value="languages" className="flex-1 sm:flex-none px-4 md:px-6">Languages</TabsTrigger>
                        <TabsTrigger value="environment" className="flex-1 sm:flex-none px-4 md:px-6">Environment</TabsTrigger>
                        <TabsTrigger value="achievements" className="flex-1 sm:flex-none px-4 md:px-6">Achievements</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="overview" className="space-y-8">
                    {/* Quick Stats Grid */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <StatCard title="Coding Time" value={stats?.summary.totalTime24h} subtitle="Last 24 Hours" icon={Clock} loading={isLoading} />
                        <StatCard title="Daily Mean" value={stats?.summary.dailyAverage} subtitle="Consistency Goal: 4h" icon={Activity} loading={isLoading} />
                        <StatCard title="Primary Target" value={stats?.summary.topProject24h} subtitle="Active Project (24h)" icon={Layout} loading={isLoading} />
                        <StatCard title="Main Stack" value={stats?.summary.topLanguage24h} subtitle="Last 24 Hours" icon={Code} logo={stats?.summary.topLanguageIcon24h} loading={isLoading} />
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
                                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value} h`} />
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

                <TabsContent value="environment" className="space-y-8">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>Editors</CardTitle>
                                <CardDescription>Your favorite coding environments.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {stats?.editors.map(editor => (
                                        <div key={editor.name} className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-muted/40 p-1.5 border border-muted/50 overflow-hidden">
                                                        {getIconComponent(editor.name, 'editor')}
                                                    </div>
                                                    <span className="font-bold text-base capitalize">{editor.name}</span>
                                                </div>
                                                <span className="text-muted-foreground font-medium">{editor.value}%</span>
                                            </div>
                                            <Progress value={editor.value} className="h-2" />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>Platforms</CardTitle>
                                <CardDescription>Deployment and development operating systems.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {stats?.platforms.map(platform => (
                                        <div key={platform.name} className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-muted/40 p-1.5 border border-muted/50 overflow-hidden">
                                                        {getIconComponent(platform.name, 'platform')}
                                                    </div>
                                                    <span className="font-bold text-base uppercase">{platform.name === 'win32' ? 'Windows' : platform.name === 'darwin' ? 'macOS' : platform.name}</span>
                                                </div>
                                                <span className="text-muted-foreground font-medium">{platform.value}%</span>
                                            </div>
                                            <Progress value={platform.value} className="h-2" />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                <TabsContent value="achievements" className="space-y-8">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {isLoading ? (
                            [1, 2, 3].map(i => (
                                <Card key={i} className="shadow-sm border-muted/60">
                                    <CardHeader className="pb-2">
                                        <Skeleton className="h-6 w-3/4 mb-2" />
                                        <Skeleton className="h-4 w-full" />
                                    </CardHeader>
                                    <CardContent>
                                        <Skeleton className="h-20 w-20 rounded-full mx-auto" />
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            stats?.summary.achievements.map((achievement) => (
                                <Card key={achievement.id} className="relative overflow-hidden group border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all duration-300">
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                                {achievement.name}
                                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                            </CardTitle>
                                            <Badge variant="secondary" className="bg-primary/20 text-primary-foreground text-[10px]">
                                                Unlocked
                                            </Badge>
                                        </div>
                                        <CardDescription className="text-xs">
                                            {achievement.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex flex-col items-center justify-center pt-4 pb-6">
                                        <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-500 grayscale-0">
                                            {achievement.icon || '🏆'}
                                        </div>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold flex items-center gap-1">
                                            <Award className="h-3 w-3" />
                                            {new Date(achievement.unlockedAt).toLocaleDateString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))
                        )}

                        {/* Placeholder for locked achievements */}
                        {!isLoading && stats?.summary.achievements.length === 0 && (
                            <div className="col-span-full py-12 text-center border-2 border-dashed border-muted rounded-2xl">
                                <Trophy className="h-12 w-12 text-muted mx-auto mb-4 opacity-20" />
                                <h3 className="text-lg font-semibold text-muted-foreground">No achievements yet</h3>
                                <p className="text-sm text-muted-foreground">Keep coding to unlock your first trophy!</p>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            <Dialog
                open={showVerificationDialog}
                onOpenChange={(open) => {
                    setShowVerificationDialog(open);
                    if (!open) setHasDismissed(true);
                }}
            >
                <DialogContent className="sm:max-w-md bg-black border-white/10">
                    <DialogHeader>
                        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <Mail className="h-6 w-6 text-primary" />
                        </div>
                        <DialogTitle className="text-2xl font-bold text-center">Verify your email</DialogTitle>
                        <DialogDescription className="text-center text-muted-foreground pt-2">
                            To protect your account and access all features, please verify your email address.
                            If you haven't received the link, we can send it again.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="sm:justify-center gap-2 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowVerificationDialog(false);
                                setHasDismissed(true);
                            }}
                            className="rounded-full border-white/10 hover:bg-white/5"
                        >
                            Later
                        </Button>
                        <Button
                            onClick={handleSendVerification}
                            disabled={sendingEmail}
                            className="rounded-full bg-primary text-black hover:bg-primary/90 font-bold px-8 shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]"
                        >
                            {sendingEmail ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                "Send Verification Link"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[600px]">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse text-sm">Synchronizing your statistics...</p>
                </div>
            </div>
        }>
            <DashboardContent />
        </Suspense>
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
