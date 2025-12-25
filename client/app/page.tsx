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

interface Stats {
  activityByDay: { name: string; total: number }[];
  languages: { name: string; value: number; color: string }[];
  projects: { name: string; value: number; hours: number }[];
  recentActivity: {
    id: string;
    project: string;
    language: string;
    file: string;
    timestamp: string;
  }[];
  summary: {
    totalTime: string;
    dailyAverage: string;
    topProject: string;
    topLanguage: string;
  };
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DashboardPage() {
  const { data: session, isPending: isAuthPending } = authClient.useSession();
  const { data: stats, isLoading } = useSWR<Stats>(
    session ? "/api/stats" : null,
    fetcher,
    { refreshInterval: 60000 } // Refresh every minute
  );

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
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] space-y-6">
        <div className="p-4 rounded-full bg-primary/5">
          <Zap className="h-12 w-12 text-primary" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Track your craft.</h2>
          <p className="text-muted-foreground max-w-xs mx-auto">
            Join the elite circle of developers tracking their progress in real-time.
          </p>
        </div>
        <Button size="lg" onClick={() => (window.location.href = "/auth/sign-in")} className="px-8">
          Get Started
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-4xl font-extrabold tracking-tight">Bonjour, {session.user.name?.split(' ')[0]}</h2>
          <p className="text-muted-foreground flex items-center">
            <TrendingUp className="mr-2 h-4 w-4 text-green-500" />
            Your coding output is up 12% compared to last week.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="px-3 py-1.5 bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">
            <Activity className="mr-2 h-4 w-4 animate-pulse" />
            Live Tracking Active
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
            <StatCard title="Main Stack" value={stats?.summary.topLanguage} subtitle="Primary language" icon={Code} loading={isLoading} />
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
                        <div key={activity.id} className="flex items-start space-x-3">
                          <div className="mt-1 h-2 w-2 rounded-full bg-primary ring-4 ring-primary/10" />
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">
                              {activity.project}
                              <span className="text-muted-foreground font-normal ml-2">in {activity.language}</span>
                            </p>
                            <p className="text-xs text-muted-foreground truncate w-48">
                              {activity.file.split('/').pop()}
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase opacity-70">
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
                        <div className="flex items-center">
                          <div className="mr-2 h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: lang.color }} />
                          <span className="font-bold">{lang.name}</span>
                        </div>
                        <span className="text-muted-foreground">{lang.value}%</span>
                      </div>
                      <Progress value={lang.value} className="h-2" style={{ backgroundColor: 'rgba(0,0,0,0.05)' }} />
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

function StatCard({ title, value, subtitle, icon: Icon, loading }: any) {
  return (
    <Card className="relative overflow-hidden group border-muted/60 hover:border-primary/50 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors">{title}</CardTitle>
        <div className="p-2 rounded-lg bg-primary/5 group-hover:bg-primary/10 transition-colors">
          <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
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
        <Icon className="h-12 w-12" />
      </div>
    </Card>
  );
}
