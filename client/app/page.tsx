"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { Activity, Clock, Code, Layout, Settings, Key } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const mockStats = [
  { name: "Mon", total: 4.5 },
  { name: "Tue", total: 6.2 },
  { name: "Wed", total: 5.8 },
  { name: "Thu", total: 7.4 },
  { name: "Fri", total: 4.9 },
  { name: "Sat", total: 2.1 },
  { name: "Sun", total: 1.5 },
];

const mockLanguages = [
  { name: "TypeScript", value: 45, color: "#3178c6" },
  { name: "JavaScript", value: 25, color: "#f1e05a" },
  { name: "Rust", value: 15, color: "#dea584" },
  { name: "Python", value: 10, color: "#3572A5" },
  { name: "HTML", value: 5, color: "#e34c26" },
];

const mockProjects = [
  { name: "DevMeter", time: "12h 45m" },
  { name: "Portfolio", time: "4h 20m" },
  { name: "Open Source", time: "2h 15m" },
];

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6 bg-background text-foreground">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
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
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Coding Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">32h 41m</div>
                <p className="text-xs text-muted-foreground">+12% from last week</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4h 32m</div>
                <p className="text-xs text-muted-foreground">+5% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Project</CardTitle>
                <Layout className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">DevMeter</div>
                <p className="text-xs text-muted-foreground">39% of total time</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Language</CardTitle>
                <Code className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">TypeScript</div>
                <p className="text-xs text-muted-foreground">45% usage</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Activity (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={mockStats}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}h`} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
                    <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Languages</CardTitle>
                <CardDescription>Breakdown by usage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {mockLanguages.map((lang) => (
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
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>Use this key to connect your VS Code extension.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-muted p-2 rounded-md font-mono text-sm border">
                  dev_meter_sk_********************************
                </div>
                <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                  Copy Key
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                <Key className="inline mr-2 h-4 w-4" />
                Paste this key into the VS Code command palette via <strong>DevMeter: Enter API Key</strong>.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
