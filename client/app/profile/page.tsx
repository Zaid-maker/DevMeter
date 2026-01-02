"use client";

import { authClient } from "@/lib/auth-client";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import useSWR from "swr";
import {
    Calendar,
    Clock,
    Flame,
    Trophy,
    Activity,
    Code,
    Layout,
    Share2,
    Globe,
    Mail,
    Github,
    Twitter,
    Loader2,
    TrendingUp,
    ExternalLink
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useState, useEffect } from "react";

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface ContributionData {
    contributions: { date: string, count: number }[];
    streaks: { current: number, longest: number };
    summary: { totalHours: number, daysActive: number, averagePerDay: number };
}

interface StatsData {
    languages: { name: string; value: number; color: string; icon: string }[];
    projects: { name: string; value: number; hours: number }[];
}

export default function ProfilePage() {
    const { data: session, isPending: isAuthPending } = authClient.useSession();
    const { data: contributionData, isLoading: isContribLoading } = useSWR<ContributionData>(
        session ? "/api/stats/contribution" : null,
        fetcher
    );
    const { data: stats, isLoading: isStatsLoading } = useSWR<StatsData>(
        session ? "/api/stats" : null,
        fetcher
    );

    const [isSharing, setIsSharing] = useState(false);
    const [currentTimezone, setCurrentTimezone] = useState<string>("UTC");
    const [isUpdatingTz, setIsUpdatingTz] = useState(false);

    const timezones = Intl.supportedValuesOf('timeZone');

    useEffect(() => {
        const user = session?.user as any;
        if (user?.timezone) {
            setCurrentTimezone(user.timezone);
        } else {
            setCurrentTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
        }
    }, [session?.user]);

    const handleTimezoneChange = async (tz: string) => {
        setIsUpdatingTz(true);
        setCurrentTimezone(tz);
        try {
            const res = await fetch("/api/user/timezone", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ timezone: tz }),
            });

            if (!res.ok) throw new Error("Failed to update timezone");

            toast.success("Timezone updated", {
                description: `Successfully set to ${tz}`
            });
        } catch (error) {
            console.error(error);
            toast.error("Update failed", {
                description: "Could not save your timezone preference."
            });
            // Revert on error
            const user = session?.user as any;
            if (user?.timezone) setCurrentTimezone(user.timezone);
        } finally {
            setIsUpdatingTz(false);
        }
    };

    if (isAuthPending) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!session) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[600px] space-y-4">
                <h1 className="text-2xl font-bold">Please sign in to view your profile</h1>
                <Button asChild>
                    <a href="/auth/sign-in">Sign In</a>
                </Button>
            </div>
        );
    }

    const user = session.user;
    const userInitial = user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || "DM";

    const handleShare = () => {
        setIsSharing(true);
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        toast.success("Profile link copied!", {
            description: "Anyone with this link can view your coding activity."
        });
        setTimeout(() => setIsSharing(false), 2000);
    };

    return (
        <div className="flex-1 space-y-10 p-4 md:p-8 pt-6 max-w-6xl mx-auto">
            {/* Profile Hero Section */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-purple-600/20 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex flex-col md:flex-row items-center gap-8 bg-card/50 backdrop-blur-xl border border-white/5 p-8 rounded-3xl overflow-hidden">
                    <div className="relative">
                        <div className="absolute -inset-2 bg-gradient-to-tr from-primary to-purple-600 rounded-full blur-sm opacity-30 animate-pulse"></div>
                        <Avatar className="h-32 w-32 border-4 border-background ring-2 ring-primary/20">
                            <AvatarImage src={user.image || ""} alt={user.name} />
                            <AvatarFallback className="text-4xl font-black bg-primary/10 text-primary">{userInitial}</AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-1 right-1 h-6 w-6 bg-green-500 border-4 border-background rounded-full"></div>
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-4">
                        <div className="space-y-1">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                <h1 className="text-4xl font-extrabold tracking-tight">{user.name}</h1>
                                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">Pro Developer</Badge>
                            </div>
                            <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2">
                                <Mail className="h-4 w-4" /> {user.email}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                            <div className="flex items-center gap-1.5 text-sm font-medium">
                                <Calendar className="h-4 w-4 text-primary" />
                                <span>Joined {format(new Date(user.createdAt), "MMMM yyyy")}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm font-medium">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-auto p-0 font-medium hover:bg-transparent group/tz">
                                            <Globe className="h-4 w-4 text-primary group-hover/tz:rotate-12 transition-transform" />
                                            <span className="ml-1.5 border-b border-dashed border-primary/30 group-hover/tz:border-primary transition-colors">
                                                {currentTimezone}
                                            </span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-[240px] border-white/10 bg-black/90 backdrop-blur-xl p-0 shadow-2xl overflow-hidden rounded-xl">
                                        <div className="p-2 border-b border-white/5 bg-white/5">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 py-1">Select Timezone</p>
                                        </div>
                                        <ScrollArea className="h-[300px]">
                                            <div className="p-1">
                                                {timezones.map(tz => (
                                                    <DropdownMenuItem
                                                        key={tz}
                                                        onClick={() => handleTimezoneChange(tz)}
                                                        className={`rounded-lg cursor-pointer ${tz === currentTimezone ? 'bg-primary/20 text-primary' : 'hover:bg-white/5'}`}
                                                    >
                                                        {tz}
                                                    </DropdownMenuItem>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                            <Button variant="outline" size="sm" className="rounded-full gap-2 border-white/10 hover:bg-white/5">
                                <Github className="h-4 w-4" /> GitHub
                            </Button>
                            <Button variant="outline" size="sm" className="rounded-full gap-2 border-white/10 hover:bg-white/5">
                                <Twitter className="h-4 w-4" /> Twitter
                            </Button>
                            <Button size="sm" className="rounded-full gap-2 px-6 shadow-lg shadow-primary/20" onClick={handleShare} disabled={isSharing}>
                                <Share2 className="h-4 w-4" /> {isSharing ? "Copied!" : "Share Profile"}
                            </Button>
                        </div>
                    </div>

                    {/* Quick Overview Badges */}
                    <div className="hidden lg:flex flex-col gap-4">
                        <div className="bg-white/5 border border-white/5 p-4 rounded-2xl backdrop-blur-md">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Rank</p>
                            <p className="text-xl font-black text-primary">#142 <span className="text-xs font-normal text-muted-foreground">Global</span></p>
                        </div>
                        <div className="bg-white/5 border border-white/5 p-4 rounded-2xl backdrop-blur-md">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Commitment</p>
                            <p className="text-xl font-black text-green-500">Superb</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Impact Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Total Coding Time"
                    value={contributionData ? `${Math.floor(contributionData.summary.totalHours)}h ${Math.round((contributionData.summary.totalHours % 1) * 60)}m` : "--"}
                    subtitle="Last 365 days"
                    icon={Clock}
                    loading={isContribLoading}
                />
                <StatsCard
                    title="Daily Average"
                    value={contributionData ? `${contributionData.summary.averagePerDay}h` : "--"}
                    subtitle="Per active day"
                    icon={TrendingUp}
                    loading={isContribLoading}
                />
                <StatsCard
                    title="Current Streak"
                    value={contributionData ? `${contributionData.streaks.current} Days` : "--"}
                    subtitle="Keeping it alive"
                    icon={Flame}
                    color="text-orange-500"
                    loading={isContribLoading}
                />
                <StatsCard
                    title="Longest Streak"
                    value={contributionData ? `${contributionData.streaks.longest} Days` : "--"}
                    subtitle="Your personal best"
                    icon={Trophy}
                    color="text-yellow-500"
                    loading={isContribLoading}
                />
            </div>

            {/* Contribution Graph */}
            <Card className="border-white/5 bg-card/30 backdrop-blur-md overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-bold">Contribution Activity</CardTitle>
                        <CardDescription>Coding intensity over the past year</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Less</span>
                        {[0, 1, 2, 3, 4].map(i => (
                            <div key={i} className={`h-3 w-3 rounded-sm ${getLevelColor(i * 2)}`} />
                        ))}
                        <span>More</span>
                    </div>
                </CardHeader>
                <CardContent>
                    {isContribLoading ? (
                        <div className="h-40 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto no-scrollbar py-2">
                            <div className="min-w-[800px]">
                                <ContributionGraph data={contributionData?.contributions || []} />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid gap-8 md:grid-cols-2">
                {/* Top Languages */}
                <Card className="border-white/5 bg-card/30 backdrop-blur-md">
                    <CardHeader className="flex flex-row items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10">
                            <Code className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle>Top Languages</CardTitle>
                            <CardDescription>Your favorite tech stack</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {isStatsLoading ? (
                            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
                        ) : stats?.languages.map(lang => (
                            <div key={lang.name} className="space-y-2 group">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/5 p-2 shadow-inner border border-white/5 group-hover:border-primary/50 transition-colors">
                                            <img
                                                src={lang.icon}
                                                alt={lang.name}
                                                className="h-full w-full object-contain"
                                                style={{ filter: "brightness(1.2) saturate(1.3)" }}
                                            />
                                        </div>
                                        <span className="font-bold text-base transition-colors group-hover:text-primary">{lang.name}</span>
                                    </div>
                                    <span className="text-muted-foreground font-medium">{lang.value}%</span>
                                </div>
                                <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out"
                                        style={{
                                            width: `${lang.value}%`,
                                            backgroundColor: lang.color,
                                            boxShadow: `0 0 10px ${lang.color}40`
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Top Projects */}
                <Card className="border-white/5 bg-card/30 backdrop-blur-md">
                    <CardHeader className="flex flex-row items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10">
                            <Layout className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle>Top Projects</CardTitle>
                            <CardDescription>Most time spent on these workspaces</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {isStatsLoading ? (
                            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
                        ) : stats?.projects.map((project, i) => (
                            <div key={project.name} className="space-y-2 group">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/5 p-2 shadow-inner border border-white/5 group-hover:border-primary/50 transition-colors">
                                            <Activity className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-base transition-colors group-hover:text-primary">{project.name}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{project.hours} Hours tracked</span>
                                        </div>
                                    </div>
                                    <span className="text-muted-foreground font-medium">{project.value}%</span>
                                </div>
                                <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]"
                                        style={{ width: `${project.value}%`, transitionDelay: `${i * 100}ms` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function StatsCard({ title, value, subtitle, icon: Icon, color = "text-primary", loading }: any) {
    return (
        <Card className="relative overflow-hidden group border-white/5 bg-card/30 backdrop-blur-md hover:border-primary/30 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">{title}</CardTitle>
                <div className={`p-2 rounded-lg bg-white/5 group-hover:scale-110 transition-transform`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <Skeleton className="h-8 w-24" />
                ) : (
                    <div className="space-y-1">
                        <div className="text-3xl font-black tracking-tighter">{value}</div>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter opacity-70">
                            {subtitle}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function ContributionGraph({ data }: { data: { date: string, count: number }[] }) {
    const today = new Date();
    const startDate = subDays(today, 364);

    // Simple lookup map
    const dataMap = new Map(data.map(d => [d.date, d.count]));

    // Generate all days in last year
    const days = eachDayOfInterval({ start: startDate, end: today });

    // Group days by week for the grid
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];

    days.forEach(day => {
        if (day.getDay() === 0 && currentWeek.length > 0) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
        currentWeek.push(day);
    });
    if (currentWeek.length > 0) weeks.push(currentWeek);

    return (
        <div className="flex gap-1.5 overflow-hidden">
            <div className="grid grid-rows-7 gap-1.5 text-[9px] text-muted-foreground pr-2 font-mono uppercase pt-4 opacity-50">
                <span></span><span>Mon</span><span></span><span>Wed</span><span></span><span>Fri</span><span></span>
            </div>
            {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="grid grid-rows-7 gap-1.5">
                    {/* Month labels (rough positioning) */}
                    {weekIdx % 4 === 0 && week[0] && (
                        <div className="absolute -mt-4 text-[9px] font-mono text-muted-foreground uppercase opacity-50">
                            {format(week[0], "MMM")}
                        </div>
                    )}
                    {Array.from({ length: 7 }).map((_, dayIdx) => {
                        const dayInWeek = week.find(d => d.getDay() === dayIdx);
                        if (!dayInWeek) return <div key={dayIdx} className="h-3 w-3" />;

                        const dateStr = format(dayInWeek, "yyyy-MM-dd");
                        const count = dataMap.get(dateStr) || 0;

                        return (
                            <TooltipProvider key={dayIdx}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div
                                            className={`h-3 w-3 rounded-sm transition-all duration-500 hover:ring-2 hover:ring-primary/50 cursor-pointer ${getLevelColor(count)}`}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="bg-black border-white/10 text-[10px] p-2">
                                        <p className="font-bold">{count.toFixed(1)} Hours</p>
                                        <p className="text-muted-foreground">{format(dayInWeek, "EEEE, MMMM do")}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}

function getLevelColor(count: number) {
    if (count === 0) return "bg-white/5 border border-white/5";
    if (count < 1) return "bg-primary/20 border border-primary/10";
    if (count < 3) return "bg-primary/40 border border-primary/20";
    if (count < 6) return "bg-primary/70 border border-primary/30";
    return "bg-primary border border-primary/40 shadow-[0_0_8px_rgba(var(--primary-rgb),0.4)]";
}
