"use client";

import { useEffect, useState, Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bar, BarChart, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts";
import { Activity, Clock, Code, Layout, Key, Copy, Plus, RefreshCw, Loader2, Zap, ArrowUpRight, TrendingUp, Monitor, Terminal, Flame, Calendar, Target, FolderOpen, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow, format, subDays, eachDayOfInterval } from "date-fns";
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
import { Mail, Star, Trophy, Award, Check } from "lucide-react";
import { getXPLvlProgress } from "@/lib/gamification";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Stats {
    activityByDay: { name: string; total: number }[];
    languages: { name: string; value: number; color: string; icon: string }[];
    projects: { name: string; value: number; hours: number; color: string }[];
    recentActivity: {
        id: string;
        project: string;
        language: string;
        file: string;
        editor: string | null;
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
            unlockedAt?: string;
            isUnlocked: boolean;
        }[];
    };
    editors: { name: string; value: number; color: string; icon: string }[];
    platforms: { name: string; value: number; color: string; icon: string }[];
    machines: { name: string; value: number; hours: number; color: string }[];
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
        { refreshInterval: 60000 }
    );
    const { data: contributionData, isLoading: isContribLoading, error: contribError } = useSWR<{
        contributions: { date: string; count: number }[];
        streaks: { current: number; longest: number };
        summary: { totalHours: number; daysActive: number; averagePerDay: number };
    }>(
        session ? "/api/stats/contribution" : null,
        fetcher,
        { refreshInterval: 300000, errorRetryCount: 3 } // Refresh every 5 min, retry on error
    );
    const router = useRouter()
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", value);
        window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
    };

    const [sendingEmail, setSendingEmail] = useState(false);
    const [showVerificationDialog, setShowVerificationDialog] = useState(false);
    const [hasDismissed, setHasDismissed] = useState(false);

    // Username state for public profile
    const [username, setUsername] = useState<string | null>(null);
    const [showUsernameDialog, setShowUsernameDialog] = useState(false);
    const [usernameInput, setUsernameInput] = useState("");
    const [usernameError, setUsernameError] = useState("");
    const [savingUsername, setSavingUsername] = useState(false);
    const [checkingUsername, setCheckingUsername] = useState(false);
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

    useEffect(() => {
        if (session?.user) {
            fetch("/api/user")
                .then(res => res.json())
                .then(data => {
                    if (data.username) setUsername(data.username);
                })
                .catch(() => {});
        }
    }, [session?.user]);

    // Debounced username availability check
    useEffect(() => {
        if (!usernameInput || usernameInput.length < 3) {
            setUsernameAvailable(null);
            return;
        }
        const regex = /^[a-z0-9]([a-z0-9_-]{1,28}[a-z0-9])$/;
        if (!regex.test(usernameInput)) {
            setUsernameAvailable(null);
            return;
        }

        setCheckingUsername(true);
        setUsernameAvailable(null);

        const timeout = setTimeout(() => {
            fetch(`/api/user/username-check?username=${encodeURIComponent(usernameInput)}`)
                .then(res => res.json())
                .then(data => {
                    setUsernameAvailable(data.available);
                    if (!data.available) setUsernameError("Username already taken");
                    else setUsernameError("");
                })
                .catch(() => setUsernameAvailable(null))
                .finally(() => setCheckingUsername(false));
        }, 500);

        return () => clearTimeout(timeout);
    }, [usernameInput]);

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
            if (lowerName === 'vscode') {
                return (
                    <img
                        src="/icons/vscode_nano.png"
                        alt="VS Code"
                        className="h-full w-full object-contain"
                        style={{ filter: "brightness(1.1) saturate(1.2)" }}
                    />
                );
            }
            if (lowerName.includes('code-server')) {
                return (
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full p-0.5">
                        <rect width="24" height="24" rx="4" fill="#1A8CFF" />
                        <path d="M8 7L4 12L8 17M16 7L20 12L16 17M13 6L11 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                );
            }
            if (lowerName.includes('cursor')) {
                return (
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full p-0.5">
                        <rect width="24" height="24" rx="4" fill="#111" />
                        <path d="M7 4L18 12L12 13L15 20L12.5 21L9.5 14L7 17V4Z" fill="#7C3AED" />
                    </svg>
                );
            }
            if (lowerName.includes('windsurf')) {
                return (
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full p-0.5">
                        <rect width="24" height="24" rx="4" fill="#0A1628" />
                        <path d="M6 18C8 14 10 10 16 6C14 10 13 14 12 18" stroke="#00C9A7" strokeWidth="2.5" strokeLinecap="round"/>
                        <path d="M10 16C12 12 14 10 18 8" stroke="#00C9A7" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
                    </svg>
                );
            }
            if (lowerName.includes('vscodium')) {
                return (
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full p-0.5">
                        <rect width="24" height="24" rx="4" fill="#2F80ED" />
                        <path d="M8 7L4 12L8 17M16 7L20 12L16 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                );
            }
            if (lowerName.includes('claude')) {
                return (
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full p-0.5">
                        <rect width="24" height="24" rx="4" fill="#2D2B2A" />
                        <circle cx="12" cy="12" r="6" fill="#D97757" />
                        <circle cx="12" cy="12" r="2.5" fill="#2D2B2A" />
                    </svg>
                );
            }
            if (lowerName.includes('terminal')) {
                return <Terminal className="h-full w-full p-0.5 text-emerald-400" />;
            }
            if (lowerName.includes('external')) {
                return <Code className="h-full w-full p-0.5 text-green-600" />;
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

    const isDeleted = (session.user as any).deletedAt;

    if (isDeleted) {
        return (
            <div className="flex items-center justify-center min-h-[600px] p-4">
                <Card className="max-w-md w-full border-primary/20 bg-primary/5 backdrop-blur-sm shadow-2xl">
                    <CardHeader className="text-center space-y-4">
                        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <RefreshCw className="h-8 w-8 text-primary animate-spin-slow" />
                        </div>
                        <div className="space-y-2">
                            <CardTitle className="text-3xl font-black tracking-tighter">WELCOME BACK.</CardTitle>
                            <CardDescription className="text-base">
                                Your account is currently deactivated. Would you like to restore your progress, XP, and achievements?
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <Button
                            className="w-full h-12 text-lg font-bold rounded-xl shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
                            onClick={async () => {
                                try {
                                    const res = await fetch("/api/user/reactivate", { method: "POST" });
                                    if (res.ok) {
                                        toast.success("Account Reactivated!", {
                                            description: "Welcome back! Getting your stats ready..."
                                        });
                                        window.location.reload();
                                    } else {
                                        toast.error("Failed to reactivate account.");
                                    }
                                } catch (err) {
                                    toast.error("An error occurred during reactivation.");
                                }
                            }}
                        >
                            Reactivate My Account
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full text-muted-foreground hover:text-destructive"
                            onClick={() => authClient.signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/"; } } })}
                        >
                            Log Out
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
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
                        className="rounded-lg h-9"
                        onClick={() => {
                            if (username) {
                                const publicUrl = `${window.location.origin}/u/${username}`;
                                navigator.clipboard.writeText(publicUrl);
                                toast.success("Public profile link copied!", {
                                    description: publicUrl,
                                });
                            } else {
                                setUsernameInput("");
                                setUsernameError("");
                                setShowUsernameDialog(true);
                            }
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
                                            <RechartsTooltip
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
                                            {stats?.recentActivity.map((activity) => {
                                                const editorLower = (activity.editor || '').toLowerCase();
                                                const isClaudeCode = editorLower === 'claude-code';
                                                const isTerminalEditor = editorLower === 'terminal';
                                                const useEditorIcon = isClaudeCode || isTerminalEditor;

                                                return (
                                                <div key={activity.id} className="flex items-start space-x-4">
                                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted/40 p-2.5 shadow-sm border border-muted/50 backdrop-blur-sm">
                                                        {useEditorIcon ? (
                                                            getIconComponent(activity.editor!, 'editor')
                                                        ) : (
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
                                                        )}
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
                                                );
                                            })}
                                        </div>
                                    </ScrollArea>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Contribution Heatmap */}
                    <Card className="shadow-sm border-muted/60">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-primary" />
                                    Contribution Map
                                </CardTitle>
                                <CardDescription>Your coding activity over the past year</CardDescription>
                            </div>
                            {contributionData?.streaks && (
                                <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-1.5">
                                        <Flame className="h-4 w-4 text-orange-400" />
                                        <span className="font-bold">{contributionData.streaks.current}d</span>
                                        <span className="text-muted-foreground text-xs">streak</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Trophy className="h-4 w-4 text-yellow-400" />
                                        <span className="font-bold">{contributionData.streaks.longest}d</span>
                                        <span className="text-muted-foreground text-xs">best</span>
                                    </div>
                                </div>
                            )}
                        </CardHeader>
                        <CardContent>
                            {(isContribLoading || (!contributionData && !contribError && session)) ? (
                                <Skeleton className="h-[140px] w-full" />
                            ) : contribError ? (
                                <p className="text-muted-foreground text-sm text-center py-8">Failed to load contribution data. Retrying...</p>
                            ) : contributionData?.contributions ? (
                                <div className="space-y-4">
                                    <ContributionHeatmap data={contributionData.contributions} />
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                                            <span>Less</span>
                                            {[0, 0.25, 0.75, 2, 5, 7].map((v) => (
                                                <div
                                                    key={v}
                                                    className={`h-[10px] w-[10px] rounded-[2px] border ${getLevelColor(v)}`}
                                                />
                                            ))}
                                            <span>More</span>
                                        </div>
                                        {contributionData.summary && (
                                            <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-mono">
                                                <span><strong className="text-foreground">{contributionData.summary.totalHours.toFixed(0)}h</strong> total</span>
                                                <span><strong className="text-foreground">{contributionData.summary.daysActive}</strong> days active</span>
                                                <span><strong className="text-foreground">{contributionData.summary.averagePerDay.toFixed(1)}h</strong>/day avg</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-sm text-center py-8">No contribution data available yet. Start coding to fill your map!</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Insights Row */}
                    {contributionData?.summary && (
                        <div className="grid gap-4 md:grid-cols-3">
                            <Card className="shadow-sm border-muted/60">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20">
                                            <Flame className="h-6 w-6 text-orange-400" />
                                        </div>
                                        <div>
                                            <p className="text-3xl font-black tracking-tight">{contributionData.streaks.current}</p>
                                            <p className="text-xs text-muted-foreground font-medium">Day Streak</p>
                                        </div>
                                        <div className="ml-auto text-right">
                                            <p className="text-sm font-bold text-muted-foreground">{contributionData.streaks.longest}</p>
                                            <p className="text-[10px] text-muted-foreground">Best</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="shadow-sm border-muted/60">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
                                            <Calendar className="h-6 w-6 text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-3xl font-black tracking-tight">{contributionData.summary.daysActive}</p>
                                            <p className="text-xs text-muted-foreground font-medium">Days Active</p>
                                        </div>
                                        <div className="ml-auto text-right">
                                            <p className="text-sm font-bold text-muted-foreground">{contributionData.summary.totalHours.toFixed(0)}h</p>
                                            <p className="text-[10px] text-muted-foreground">Total</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="shadow-sm border-muted/60">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                            <Target className="h-6 w-6 text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-3xl font-black tracking-tight">{contributionData.summary.averagePerDay.toFixed(1)}</p>
                                            <p className="text-xs text-muted-foreground font-medium">Hours/Day Avg</p>
                                        </div>
                                        <div className="ml-auto text-right">
                                            <p className="text-sm font-bold text-muted-foreground">
                                                {contributionData.summary.averagePerDay >= 4 ? "On Track" : "Keep Going"}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">Goal: 4h</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="projects" className="space-y-6">
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
                                <div className="grid gap-12 md:grid-cols-2 py-4">
                                    {/* Donut Chart */}
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="relative w-full" style={{ height: 280 }}>
                                            <ResponsiveContainer width="100%" height={280}>
                                                <PieChart>
                                                    <Pie
                                                        data={stats?.projects || []}
                                                        dataKey="value"
                                                        nameKey="name"
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={65}
                                                        outerRadius={105}
                                                        paddingAngle={3}
                                                        strokeWidth={0}
                                                        animationDuration={800}
                                                    >
                                                        {stats?.projects.map((project, i) => (
                                                            <Cell key={i} fill={project.color} />
                                                        ))}
                                                    </Pie>
                                                    <RechartsTooltip
                                                        contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                                                        itemStyle={{ color: '#fff' }}
                                                        formatter={(value: number, name: string) => {
                                                            const proj = stats?.projects.find(p => p.name === name);
                                                            return [`${value}% (${proj?.hours || 0}h)`, name];
                                                        }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            {/* Center label */}
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="text-center">
                                                    <p className="text-2xl font-black">
                                                        {stats?.projects.reduce((sum, p) => sum + p.hours, 0).toFixed(1) || '0'}h
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Total</p>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Legend */}
                                        <div className="flex flex-wrap justify-center gap-3 mt-2">
                                            {stats?.projects.map((project) => (
                                                <div key={project.name} className="flex items-center gap-1.5">
                                                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: project.color }} />
                                                    <span className="text-xs text-muted-foreground font-medium">{project.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Progress Bars */}
                                    <div className="space-y-6">
                                        {stats?.projects.map(project => (
                                            <div key={project.name} className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-base">{project.name}</span>
                                                            <span className="text-xs text-muted-foreground uppercase tracking-widest">{project.hours}h tracked</span>
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline" className="text-base px-3 py-1 font-bold">{project.value}%</Badge>
                                                </div>
                                                <Progress value={project.value} className="h-2.5" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Summary Cards */}
                    {!isLoading && stats?.projects && stats.projects.length > 0 && (
                        <div className="grid gap-4 md:grid-cols-3">
                            <Card className="shadow-sm">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10 border border-primary/20">
                                            <FolderOpen className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black">{stats.projects.length}</p>
                                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Projects</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="shadow-sm">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10 border border-primary/20">
                                            <Trophy className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black">{stats.projects[0]?.name || 'N/A'}</p>
                                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">{stats.projects[0]?.hours || 0}h - Most Active</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="shadow-sm">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10 border border-primary/20">
                                            <BarChart3 className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black">
                                                {(stats.projects.reduce((sum, p) => sum + p.hours, 0) / stats.projects.length).toFixed(1)}h
                                            </p>
                                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Avg / Project</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
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
                                <div className="flex flex-col items-center justify-center">
                                    <div className="relative w-full" style={{ height: 260 }}>
                                        <ResponsiveContainer width="100%" height={260}>
                                            <PieChart>
                                                <Pie
                                                    data={stats?.languages || []}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={65}
                                                    outerRadius={100}
                                                    paddingAngle={3}
                                                    strokeWidth={0}
                                                    animationDuration={800}
                                                >
                                                    {stats?.languages.map((lang, i) => (
                                                        <Cell key={i} fill={lang.color} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip
                                                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                                                    itemStyle={{ color: '#fff' }}
                                                    formatter={(value: number, name: string) => [`${value}%`, name]}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        {/* Center label */}
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="text-center">
                                                <p className="text-2xl font-black">{stats?.languages[0]?.value || 0}%</p>
                                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{stats?.languages[0]?.name || ''}</p>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Legend */}
                                    <div className="flex flex-wrap justify-center gap-3 mt-4">
                                        {stats?.languages.map((lang) => (
                                            <div key={lang.name} className="flex items-center gap-1.5">
                                                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: lang.color }} />
                                                <span className="text-xs text-muted-foreground font-medium">{lang.name}</span>
                                            </div>
                                        ))}
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
                                {/* Pie Chart */}
                                {stats?.editors && stats.editors.length > 0 && (
                                    <div className="flex justify-center mb-6">
                                        <ResponsiveContainer width={160} height={160}>
                                            <PieChart>
                                                <Pie
                                                    data={stats.editors}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={70}
                                                    strokeWidth={0}
                                                    animationDuration={800}
                                                >
                                                    {stats.editors.map((editor, i) => (
                                                        <Cell key={i} fill={editor.color} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip
                                                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                                                    itemStyle={{ color: '#fff' }}
                                                    formatter={(value: number, name: string) => [`${value}%`, name]}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
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
                                {/* Pie Chart */}
                                {stats?.platforms && stats.platforms.length > 0 && (
                                    <div className="flex justify-center mb-6">
                                        <ResponsiveContainer width={160} height={160}>
                                            <PieChart>
                                                <Pie
                                                    data={stats.platforms}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={70}
                                                    strokeWidth={0}
                                                    animationDuration={800}
                                                >
                                                    {stats.platforms.map((platform, i) => (
                                                        <Cell key={i} fill={platform.color} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip
                                                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                                                    itemStyle={{ color: '#fff' }}
                                                    formatter={(value: number, name: string) => {
                                                        const label = name === 'win32' ? 'Windows' : name === 'darwin' ? 'macOS' : name;
                                                        return [`${value}%`, label];
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
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

                    {/* Devices Section */}
                    {stats?.machines && stats.machines.length > 0 && (
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>Devices</CardTitle>
                                <CardDescription>Activity breakdown by machine. Set a custom name in VS Code settings (devmeter.deviceName).</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {stats.machines.map(machine => (
                                        <div key={machine.name} className="flex items-center gap-4 p-4 rounded-xl bg-muted/20 border border-muted/40">
                                            <div className="flex items-center justify-center h-10 w-10 rounded-xl border border-muted/50 shrink-0" style={{ backgroundColor: `${machine.color}15` }}>
                                                <Monitor className="h-5 w-5" style={{ color: machine.color }} />
                                            </div>
                                            <div className="flex-1 min-w-0 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-sm truncate">{machine.name}</span>
                                                    <Badge variant="outline" className="text-xs ml-2 shrink-0">{machine.hours}h</Badge>
                                                </div>
                                                <Progress value={machine.value} className="h-1.5" />
                                                <span className="text-[10px] text-muted-foreground">{machine.value}% of total</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
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
                                <Card
                                    key={achievement.id}
                                    className={`relative overflow-hidden group transition-all duration-300 ${achievement.isUnlocked
                                        ? "border-primary/20 bg-primary/5 hover:bg-primary/10"
                                        : "border-muted/40 bg-muted/5 opacity-80"
                                        }`}
                                >
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <CardTitle className={`text-lg font-bold flex items-center gap-2 ${!achievement.isUnlocked && "text-muted-foreground"}`}>
                                                {achievement.name}
                                                {achievement.isUnlocked && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                                            </CardTitle>
                                            <Badge
                                                variant={achievement.isUnlocked ? "secondary" : "outline"}
                                                className={`text-[10px] ${achievement.isUnlocked ? "bg-primary/20 text-primary-foreground" : "text-muted-foreground border-muted-foreground/30"}`}
                                            >
                                                {achievement.isUnlocked ? "Unlocked" : "Locked"}
                                            </Badge>
                                        </div>
                                        <CardDescription className="text-xs">
                                            {achievement.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex flex-col items-center justify-center pt-4 pb-6">
                                        <div className={`text-6xl mb-4 transition-transform duration-500 ${achievement.isUnlocked
                                            ? "group-hover:scale-110 grayscale-0"
                                            : "grayscale opacity-20"
                                            }`}>
                                            {achievement.icon || '🏆'}
                                        </div>
                                        {achievement.isUnlocked && achievement.unlockedAt ? (
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold flex items-center gap-1">
                                                <Award className="h-3 w-3" />
                                                {new Date(achievement.unlockedAt).toLocaleDateString(undefined, {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        ) : (
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold flex items-center gap-1 opacity-50">
                                                <Zap className="h-3 w-3" />
                                                Keep coding to unlock
                                            </p>
                                        )}
                                    </CardContent>
                                    {!achievement.isUnlocked && (
                                        <div className="absolute inset-0 bg-transparent pointer-events-none border-t-2 border-transparent group-hover:border-primary/20 transition-colors" />
                                    )}
                                </Card>
                            ))
                        )}

                        {/* Placeholder for no achievements at all (DB error or empty) */}
                        {!isLoading && (!stats?.summary.achievements || stats.summary.achievements.length === 0) && (
                            <div className="col-span-full py-12 text-center border-2 border-dashed border-muted rounded-2xl">
                                <Trophy className="h-12 w-12 text-muted mx-auto mb-4 opacity-20" />
                                <h3 className="text-lg font-semibold text-muted-foreground">No achievements found</h3>
                                <p className="text-sm text-muted-foreground">Connect your extensions to start winning!</p>
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

            <Dialog open={showUsernameDialog} onOpenChange={setShowUsernameDialog}>
                <DialogContent className="sm:max-w-md bg-black border-white/10">
                    <DialogHeader>
                        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <ArrowUpRight className="h-6 w-6 text-primary" />
                        </div>
                        <DialogTitle className="text-2xl font-bold text-center">Set your username</DialogTitle>
                        <DialogDescription className="text-center text-muted-foreground pt-2">
                            Choose a unique username for your public profile. Others will be able to see your coding stats at <span className="font-mono text-primary">devmeter.codepro.it/u/username</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground text-sm">@</span>
                                <div className="relative flex-1">
                                    <Input
                                        id="username"
                                        placeholder="your-username"
                                        value={usernameInput}
                                        onChange={(e) => {
                                            setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""));
                                            setUsernameError("");
                                        }}
                                        className={`bg-white/5 border-white/10 ${usernameError ? "border-destructive" : usernameAvailable === true ? "border-green-500" : ""}`}
                                        maxLength={30}
                                    />
                                    {checkingUsername && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                        </div>
                                    )}
                                    {!checkingUsername && usernameAvailable === true && usernameInput.length >= 3 && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-xs font-medium">
                                            Available
                                        </div>
                                    )}
                                </div>
                            </div>
                            {usernameError && (
                                <p className="text-xs text-destructive">{usernameError}</p>
                            )}
                            <p className="text-[10px] text-muted-foreground">3-30 characters, lowercase letters, numbers, hyphens and underscores.</p>
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowUsernameDialog(false)}
                            className="rounded-full border-white/10 hover:bg-white/5"
                        >
                            Cancel
                        </Button>
                        <Button
                            disabled={savingUsername || usernameInput.length < 3 || usernameAvailable === false || checkingUsername}
                            className="rounded-full bg-primary text-black hover:bg-primary/90 font-bold px-8 shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]"
                            onClick={async () => {
                                setSavingUsername(true);
                                setUsernameError("");
                                try {
                                    const res = await fetch("/api/user/username", {
                                        method: "PUT",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ username: usernameInput }),
                                    });
                                    const data = await res.json();
                                    if (!res.ok) {
                                        setUsernameError(data.error || "Failed to save username");
                                        return;
                                    }
                                    setUsername(data.username);
                                    // Auto-enable public profile
                                    await fetch("/api/user", {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ publicProfile: true }),
                                    });
                                    setShowUsernameDialog(false);
                                    const publicUrl = `${window.location.origin}/u/${data.username}`;
                                    navigator.clipboard.writeText(publicUrl);
                                    toast.success("Username set! Public link copied!", {
                                        description: publicUrl,
                                    });
                                } catch {
                                    setUsernameError("Something went wrong. Try again.");
                                } finally {
                                    setSavingUsername(false);
                                }
                            }}
                        >
                            {savingUsername ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Check className="mr-2 h-4 w-4" />
                                    Save & Copy Link
                                </>
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

// --- Contribution Heatmap ---

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
    const dataMap = new Map(data.map(d => [d.date, d.count]));

    // Start from the Sunday 52 weeks ago so the grid aligns properly
    const todayDow = today.getDay(); // 0=Sun
    const startDate = subDays(today, 364 + todayDow);
    const allDays = eachDayOfInterval({ start: startDate, end: today });

    // Build columns (weeks). Each column = 7 rows (Sun..Sat)
    const weeks: (Date | null)[][] = [];
    let col: (Date | null)[] = [];

    allDays.forEach((day) => {
        if (col.length === 7) {
            weeks.push(col);
            col = [];
        }
        col.push(day);
    });
    // Pad last column
    while (col.length < 7) col.push(null);
    if (col.length > 0) weeks.push(col);

    // Compute month labels: find the first week where a new month appears
    const months: { label: string; colIdx: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, i) => {
        const firstDay = week.find(d => d !== null);
        if (firstDay && firstDay.getMonth() !== lastMonth) {
            lastMonth = firstDay.getMonth();
            months.push({ label: format(firstDay, "MMM"), colIdx: i });
        }
    });

    return (
        <div className="w-full overflow-x-auto pb-1">
            {/* Month labels */}
            <div className="flex mb-1.5" style={{ paddingLeft: 36 }}>
                {weeks.map((_, i) => {
                    const m = months.find(m => m.colIdx === i);
                    return (
                        <div key={i} className="flex-shrink-0" style={{ width: 14 }}>
                            {m && (
                                <span className="text-[10px] font-medium text-muted-foreground/70 select-none">
                                    {m.label}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="flex gap-0">
                {/* Day-of-week labels */}
                <div className="flex flex-col flex-shrink-0" style={{ width: 32, gap: 3 }}>
                    {["", "Mon", "", "Wed", "", "Fri", ""].map((label, i) => (
                        <div key={i} className="flex items-center" style={{ height: 11 }}>
                            <span className="text-[9px] font-medium text-muted-foreground/60 select-none leading-none">
                                {label}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Grid */}
                <div className="flex" style={{ gap: 3 }}>
                    {weeks.map((week, colIdx) => (
                        <div key={colIdx} className="flex flex-col" style={{ gap: 3 }}>
                            {week.map((day, rowIdx) => {
                                if (!day) {
                                    return <div key={rowIdx} style={{ width: 11, height: 11 }} />;
                                }
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
                                            <TooltipContent
                                                side="top"
                                                className="bg-[#0d1117] border-[#30363d] rounded-md px-2.5 py-1.5 text-center"
                                            >
                                                <p className="text-[11px] font-semibold text-white">
                                                    {count > 0 ? `${count.toFixed(1)} hours` : "No activity"}
                                                </p>
                                                <p className="text-[10px] text-[#8b949e]">
                                                    {format(day, "EEEE, MMM d, yyyy")}
                                                </p>
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
