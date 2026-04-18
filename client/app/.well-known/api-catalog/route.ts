import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    version: "1.0",
    generatedAt: new Date().toISOString(),
    resources: [
      {
        rel: "service-doc",
        href: "/docs",
        title: "DevMeter documentation",
      },
      {
        rel: "service",
        href: "/api/stats",
        title: "Stats ingestion API",
      },
      {
        rel: "service",
        href: "/api/user",
        title: "User profile API",
      },
      {
        rel: "service",
        href: "/api/leaderboard",
        title: "Leaderboard API",
      },
    ],
  });
}
