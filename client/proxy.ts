import arcjet, { detectBot, shield, slidingWindow, fixedWindow } from "@arcjet/next";
import { NextResponse } from "next/server";

const ARCJET_KEY = process.env.ARCJET_KEY;

// Rule for Heartbeats: 60 requests per minute
const heartbeatAj = arcjet({
    key: ARCJET_KEY || "aj_local_dev_key",
    rules: [
        shield({ mode: ARCJET_KEY ? "LIVE" : "DRY_RUN" }),
        slidingWindow({
            mode: ARCJET_KEY ? "LIVE" : "DRY_RUN",
            interval: "1m",
            max: 60,
        }),
    ],
});

// Rule for Public APIs: 100 requests per 10 minutes
const publicAj = arcjet({
    key: ARCJET_KEY || "aj_local_dev_key",
    rules: [
        shield({ mode: ARCJET_KEY ? "LIVE" : "DRY_RUN" }),
        detectBot({
            mode: ARCJET_KEY ? "LIVE" : "DRY_RUN",
            allow: ["CATEGORY:SEARCH_ENGINE"],
        }),
        fixedWindow({
            mode: ARCJET_KEY ? "LIVE" : "DRY_RUN",
            window: "10m",
            max: 100,
        }),
    ],
});

export default async function middleware(request: any) {
    const { pathname } = request.nextUrl;

    if (pathname === "/api/heartbeat") {
        const decision = await heartbeatAj.protect(request);
        if (decision.isDenied()) {
            return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
        }
    }

    if (pathname.startsWith("/api/leaderboard") || pathname.startsWith("/api/stats")) {
        const decision = await publicAj.protect(request);
        if (decision.isDenied()) {
            return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/api/heartbeat", "/api/leaderboard", "/api/stats/:path*"],
};
