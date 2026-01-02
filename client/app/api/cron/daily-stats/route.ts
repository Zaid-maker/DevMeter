import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/auth";
import { calculateUserStats } from "@/lib/stats-service";
import { NextRequest, NextResponse } from "next/server";
import { subDays, format } from "date-fns";
import { TZDate } from "@date-fns/tz";

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get("x-cron-secret");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== cronSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!resend) {
        return NextResponse.json({ error: "Resend not configured" }, { status: 500 });
    }

    const now = new Date();

    try {
        const users = await prisma.user.findMany({
            where: {
                emailVerified: true,
            },
        });

        const results = [];

        for (const user of users) {
            try {
                const timezone = user.timezone || "UTC";
                const zonedNow = new TZDate(now, timezone);
                const currentHour = zonedNow.getHours();

                // Send at 8 AM local time (each hourly cron job checks this)
                // If it's 8:00-8:59 in the user's timezone, we send the report
                if (currentHour !== 8) {
                    continue;
                }

                // Yesterday string in user's timezone
                const yesterday = subDays(zonedNow, 1);
                const yesterdayStr = format(yesterday, "MMMM do, yyyy");

                const stats = await calculateUserStats(user.id, "yesterday", timezone);

                // Only send if there was some activity yesterday
                if (stats.summary.totalTime24h === "0h 0m") {
                    continue;
                }

                const { error } = await resend.emails.send({
                    from: process.env.EMAIL_FROM || "onboarding@resend.dev",
                    to: user.email,
                    subject: `Daily Productivity Report - ${yesterdayStr}`,
                    html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta name="color-scheme" content="light dark">
                        <meta name="supported-color-schemes" content="light dark">
                        <style>
                            :root {
                                color-scheme: light dark;
                                supported-color-schemes: light dark;
                            }
                            body { 
                                background-color: #ffffff; 
                                color: #000000; 
                                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
                                margin: 0; 
                                padding: 0; 
                            }
                            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
                            .card { background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 20px; padding: 40px; }
                            .logo { font-size: 20px; font-weight: 900; color: #000000; margin-bottom: 40px; letter-spacing: -0.05em; text-align: center; }
                            .header { text-align: center; margin-bottom: 40px; }
                            .title { font-size: 14px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.1em; margin-bottom: 8px; }
                            .date { font-size: 24px; font-weight: 800; color: #000000; margin: 0; }
                            
                            .stat-box { background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; text-align: left; }
                            .stat-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
                            .stat-value { font-size: 20px; font-weight: 700; color: #000000; }
                            
                            .section-title { font-size: 14px; font-weight: 700; margin-bottom: 16px; color: #000000; border-left: 3px solid #facc15; padding-left: 12px; }
                            
                            .list-item { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; padding: 12px; background-color: #ffffff; border: 1px solid #f3f4f6; border-radius: 8px; }
                            .item-name { font-size: 14px; font-weight: 600; color: #000000; }
                            .item-bar-container { height: 6px; background-color: #f3f4f6; border-radius: 3px; width: 100px; }
                            .item-bar { height: 100%; border-radius: 3px; }
                            .item-percent { font-size: 12px; color: #6b7280; width: 40px; text-align: right; }
                            
                            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #6b7280; }
                            .button { display: block; background-color: #000000; color: #ffffff !important; padding: 14px; border-radius: 12px; text-decoration: none; font-weight: 700; text-align: center; margin-top: 20px; }

                            @media (prefers-color-scheme: dark) {
                                body { background-color: #000000 !important; color: #ffffff !important; }
                                .card { background-color: #0a0a0a !important; border-color: #1f2937 !important; }
                                .logo { color: #ffffff !important; }
                                .date { color: #ffffff !important; }
                                .stat-box { background-color: #111111 !important; border-color: #1f2937 !important; }
                                .stat-value { color: #ffffff !important; }
                                .section-title { color: #ffffff !important; }
                                .list-item { background-color: #0d0d0d !important; border-color: #1f2937 !important; }
                                .item-name { color: #ffffff !important; }
                                .item-bar-container { background-color: #1f2937 !important; }
                                .item-percent { color: #9ca3af !important; }
                                .button { background-color: #ffffff !important; color: #000000 !important; }
                                .footer { color: #4b5563 !important; }
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="card">
                                <div class="logo">DevMeter</div>
                                <div class="header">
                                    <p class="title">Productivity Summary</p>
                                    <h1 class="date">${yesterdayStr}</h1>
                                </div>
                                
                                <div style="display: table; width: 100%; margin-bottom: 30px; border-collapse: separate; border-spacing: 10px 0;">
                                    <div style="display: table-row;">
                                        <div style="display: table-cell; width: 50%;">
                                            <div class="stat-box">
                                                <div class="stat-label">Coding Time</div>
                                                <div class="stat-value">${stats.summary.totalTime24h}</div>
                                            </div>
                                        </div>
                                        <div style="display: table-cell; width: 50%;">
                                            <div class="stat-box">
                                                <div class="stat-label">Current Streak</div>
                                                <div class="stat-value">${stats.summary.currentStreak} Days</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="section-title">Top Languages</div>
                                ${stats.languages.map(lang => `
                                    <div class="list-item">
                                        <div class="item-name">${lang.name}</div>
                                        <div style="display: flex; align-items: center;">
                                            <div class="item-bar-container" style="margin-right: 12px;">
                                                <div class="item-bar" style="width: ${lang.value}%; background-color: ${lang.color};"></div>
                                            </div>
                                            <div class="item-percent">${lang.value}%</div>
                                        </div>
                                    </div>
                                `).join('')}

                                <div class="section-title" style="margin-top: 30px;">Top Projects</div>
                                ${stats.projects.map(proj => `
                                    <div class="list-item">
                                        <div class="item-name">${proj.name}</div>
                                        <div style="display: flex; align-items: center;">
                                            <div class="item-percent" style="width: auto; margin-right: 12px;">${proj.hours}h</div>
                                            <div class="item-percent">${proj.value}%</div>
                                        </div>
                                    </div>
                                `).join('')}

                                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">View Full Dashboard</a>
                                
                                <div class="footer">
                                    <p>You're receiving this because you use DevMeter. Keep building.</p>
                                    <p>&copy; ${new Date().getFullYear()} DevMeter.</p>
                                </div>
                            </div>
                        </div>
                    </body>
                    </html>
                    `
                });

                if (error) {
                    console.error(`Failed to send daily stats to ${user.email}:`, error);
                    results.push({ email: user.email, status: "failed", error });
                } else {
                    results.push({ email: user.email, status: "success" });
                }
            } catch (userError) {
                console.error(`Error processing stats for ${user.email}:`, userError);
                results.push({ email: user.email, status: "error", error: userError });
            }
        }

        return NextResponse.json({ processed: results.length, details: results });
    } catch (error) {
        console.error("Daily stats cron error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
