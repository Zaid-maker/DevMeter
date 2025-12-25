"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Activity, Clock, Code, Layout, Key, Copy, Plus, RefreshCw, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { Skeleton } from "@/components/ui/skeleton";

interface Stats {
  activityByDay: { name: string; total: number }[];
  languages: { name: string; value: number; color: string }[];
  summary: {
    totalTime: string;
    dailyAverage: string;
    topProject: string;
    topLanguage: string;
  };
}

interface ApiKey {
  id: string;
  key: string;
  name: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { data: session, isPending: isAuthPending } = authClient.useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/stats");
      if (res.ok) setStats(await res.json());
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }

  if (isAuthPending) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <h2 className="text-2xl font-bold">Please sign in to view your dashboard</h2>
        <Button onClick={() => authClient.signIn.social({ provider: "google" })}>
          Sign In with Google
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 bg-background text-foreground">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Welcome back, {session.user.name}</h2>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="px-3 py-1">
            <Activity className="mr-2 h-4 w-4 text-green-500" />
            Live tracking active
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="languages">Languages</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Coding Time" value={stats?.summary.totalTime} subtitle="+12% from last week" icon={Clock} loading={loading} />
            <StatCard title="Daily Average" value={stats?.summary.dailyAverage} subtitle="+5% from last month" icon={Activity} loading={loading} />
            <StatCard title="Top Project" value={stats?.summary.topProject} subtitle="39% of total time" icon={Layout} loading={loading} />
            <StatCard title="Top Language" value={stats?.summary.topLanguage} subtitle="Primary language" icon={Code} loading={loading} />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Activity (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                {loading ? (
                  <Skeleton className="h-[350px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={stats?.activityByDay || []}>
                      <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}h`} />
                      <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
                      <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Languages</CardTitle>
                <CardDescription>Breakdown by usage</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-8 w-full" />)}
                  </div>
                ) : (
                  <div className="space-y-8">
                    {(stats?.languages || []).map((lang) => (
                      <div key={lang.name} className="flex items-center">
                        <div className="w-full flex-1 space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center">
                              <div className="mr-2 h-2 w-2 rounded-full" style={{ backgroundColor: lang.color }} />
                              <span className="font-medium">{lang.name}</span>
                            </div>
                            <span className="text-muted-foreground">{lang.value}%</span>
                          </div>
                          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${lang.value}%`, backgroundColor: lang.color }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, loading }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value || "0h 0m"}</div>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
