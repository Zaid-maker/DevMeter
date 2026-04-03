import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { subDays } from "date-fns";
import { TZDate } from "@date-fns/tz";
import {
  Activity,
  Calendar,
  Clock,
  Flame,
  Trophy,
  Code2,
  FolderKanban,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { calculateDuration, calculateStreaks } from "@/lib/stats-utils";
import { getLanguageIcon } from "@/lib/stats-service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PublicProfilePageProps {
  params: Promise<{
    userId?: string;
  }> | {
    userId?: string;
  };
}

async function getPublicProfile(userId: string) {
  if (!userId) {
    return null;
  }

  const normalized = userId.trim().toLowerCase();

  const user = await prisma.user.findFirst({
    where: {
      deletedAt: null,
      OR: [{ profileSlug: normalized }, { id: userId }],
    },
    select: {
      id: true,
      name: true,
      profileSlug: true,
      image: true,
      createdAt: true,
      timezone: true,
      heartbeats: {
        where: {
          timestamp: {
            gte: subDays(new Date(), 365),
          },
        },
        select: {
          timestamp: true,
          language: true,
          project: true,
        },
        orderBy: {
          timestamp: "desc",
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const timezone = user.timezone || "UTC";
  const totalHours = calculateDuration(user.heartbeats);

  const languageGroups = new Map<string, typeof user.heartbeats>();
  const projectGroups = new Map<string, typeof user.heartbeats>();
  const activeDays = new Set<string>();

  user.heartbeats.forEach((heartbeat) => {
    if (!languageGroups.has(heartbeat.language)) {
      languageGroups.set(heartbeat.language, []);
    }
    languageGroups.get(heartbeat.language)!.push(heartbeat);

    if (!projectGroups.has(heartbeat.project)) {
      projectGroups.set(heartbeat.project, []);
    }
    projectGroups.get(heartbeat.project)!.push(heartbeat);

    activeDays.add(format(new TZDate(heartbeat.timestamp, timezone), "yyyy-MM-dd"));
  });

  const topLanguages = Array.from(languageGroups.entries())
    .map(([name, heartbeats]) => ({
      name,
      hours: calculateDuration(heartbeats),
    }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 5)
    .map((language) => ({
      ...language,
      percent: totalHours > 0 ? Math.round((language.hours / totalHours) * 100) : 0,
      icon: getLanguageIcon(language.name),
    }));

  const topProjects = Array.from(projectGroups.entries())
    .map(([name, heartbeats]) => ({
      name,
      hours: calculateDuration(heartbeats),
    }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 5)
    .map((project) => ({
      ...project,
      percent: totalHours > 0 ? Math.round((project.hours / totalHours) * 100) : 0,
    }));

  const streaks = calculateStreaks(activeDays, timezone);

  return {
    id: user.id,
    profileSlug: user.profileSlug,
    name: user.name || "Anonymous Developer",
    image: user.image,
    createdAt: user.createdAt,
    totalHours,
    daysActive: activeDays.size,
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
    topLanguages,
    topProjects,
  };
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const resolvedParams = await params;
  const userId = resolvedParams?.userId;

  if (!userId) {
    notFound();
  }

  const profile = await getPublicProfile(userId);

  if (!profile) {
    notFound();
  }

  const totalHoursDisplay = `${Math.floor(profile.totalHours)}h ${Math.round((profile.totalHours % 1) * 60)}m`;
  const initial = profile.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary/30 selection:text-primary">
      <main className="relative z-10 p-4 md:p-8 pt-10 md:pt-16 max-w-6xl mx-auto space-y-8">
        <section className="rounded-3xl border border-white/10 bg-white/3 p-6 md:p-10">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8">
            <Avatar className="h-24 w-24 md:h-28 md:w-28 border-2 border-primary/30">
              <AvatarImage src={profile.image || ""} alt={profile.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-black">{initial || "DM"}</AvatarFallback>
            </Avatar>

            <div className="space-y-3 flex-1">
              <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10">Public Profile</Badge>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight">{profile.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-primary" />
                  Joined {format(new Date(profile.createdAt), "MMMM yyyy")}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-primary" />
                  {profile.daysActive} active days (last 365d)
                </span>
              </div>
            </div>

            <Button asChild className="rounded-full font-bold px-6">
              <Link href="/leaderboard">View Leaderboard</Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <Card className="border-white/10 bg-white/3">
            <CardHeader className="pb-2">
              <CardDescription>Total Time</CardDescription>
              <CardTitle className="text-2xl font-black inline-flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                {totalHoursDisplay}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-white/10 bg-white/3">
            <CardHeader className="pb-2">
              <CardDescription>Current Streak</CardDescription>
              <CardTitle className="text-2xl font-black inline-flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                {profile.currentStreak}d
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-white/10 bg-white/3">
            <CardHeader className="pb-2">
              <CardDescription>Longest Streak</CardDescription>
              <CardTitle className="text-2xl font-black inline-flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                {profile.longestStreak}d
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-white/10 bg-white/3">
            <CardHeader className="pb-2">
              <CardDescription>Top Language</CardDescription>
              <CardTitle className="text-2xl font-black inline-flex items-center gap-2 truncate">
                <Code2 className="h-5 w-5 text-primary" />
                <span className="truncate">{profile.topLanguages[0]?.name || "None"}</span>
              </CardTitle>
            </CardHeader>
          </Card>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <Card className="border-white/10 bg-white/3">
            <CardHeader>
              <CardTitle>Top Languages</CardTitle>
              <CardDescription>Based on coding time in the past year</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.topLanguages.length === 0 && (
                <p className="text-sm text-muted-foreground">No language activity yet.</p>
              )}
              {profile.topLanguages.map((language) => (
                <div key={language.name} className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <div className="inline-flex items-center gap-2 min-w-0">
                      <Image src={language.icon} alt={language.name} width={16} height={16} className="h-4 w-4 object-contain" />
                      <span className="font-semibold truncate">{language.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{language.hours.toFixed(1)}h ({language.percent}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${language.percent}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/3">
            <CardHeader>
              <CardTitle>Top Projects</CardTitle>
              <CardDescription>Where this developer spent the most focus time</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.topProjects.length === 0 && (
                <p className="text-sm text-muted-foreground">No project activity yet.</p>
              )}
              {profile.topProjects.map((project) => (
                <div key={project.name} className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <div className="inline-flex items-center gap-2 min-w-0">
                      <FolderKanban className="h-4 w-4 text-primary" />
                      <span className="font-semibold truncate">{project.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{project.hours.toFixed(1)}h ({project.percent}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${project.percent}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
