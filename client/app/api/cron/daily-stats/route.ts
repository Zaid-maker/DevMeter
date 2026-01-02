import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/auth";
import { calculateUserStats } from "@/lib/stats-service";
import { NextRequest, NextResponse } from "next/server";
import { subDays, format } from "date-fns";

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get("x-cron-secret");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== cronSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!resend) {
        return NextResponse.json({ error: "Resend not configured" }, { status: 500 });
    }

    const yesterday = subDays(new Date(), 1);
    const yesterdayStr = format(yesterday, "MMMM do, yyyy");

    try {
        const users = await prisma.user.findMany({
            where: {
                emailVerified: true,
            },
        });

        const results = [];

        for (const user of users) {
            try {
                const stats = await calculateUserStats(user.id, "today");

                // Only send if there was some activity yesterday
                // We check if totalTime24h is not "0h 0m"
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
                        <style>
                            body { background-color: #000000; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; }
                            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
                            .card { background-color: #0a0a0a; border: 1px solid #1f2937; border-radius: 20px; padding: 40px; }
                            .logo { font-size: 20px; font-weight: 900; color: #ffffff; margin-bottom: 40px; letter-spacing: -0.05em; text-align: center; }
                            .header { text-align: center; margin-bottom: 40px; }
                            .title { font-size: 14px; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.1em; margin-bottom: 8px; }
                            .date { font-size: 24px; font-weight: 800; color: #ffffff; margin: 0; }
                            
                            .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
                            .stat-box { background-color: #111111; border: 1px solid #1f2937; border-radius: 12px; padding: 20px; text-align: left; }
                            .stat-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
                            .stat-value { font-size: 20px; font-weight: 700; color: #ffffff; }
                            
                            .section-title { font-size: 14px; font-weight: 700; margin-bottom: 16px; color: #ffffff; border-left: 3px solid #facc15; padding-left: 12px; }
                            
                            .list-item { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; padding: 12px; background-color: #0d0d0d; border-radius: 8px; }
                            .item-info { display: flex; items-center; gap: 12px; }
                            .item-name { font-size: 14px; font-weight: 600; color: #ffffff; }
                            .item-bar-container { height: 6px; background-color: #1f2937; border-radius: 3px; width: 100px; }
                            .item-bar { height: 100%; border-radius: 3px; }
                            .item-percent { font-size: 12px; color: #9ca3af; width: 40px; text-align: right; }
                            
                            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #4b5563; }
                            .button { display: block; background-color: #ffffff; color: #000000 !important; padding: 14px; border-radius: 12px; text-decoration: none; font-weight: 700; text-align: center; margin-top: 20px; }
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
                                
                                <div style="display: table; width: 100%; margin-bottom: 30px;">
                                    <div style="display: table-cell; width: 50%; padding-right: 10px;">
                                        <div class="stat-box">
                                            <div class="stat-label">Coding Time</div>
                                            <div class="stat-value">${stats.summary.totalTime24h}</div>
                                        </div>
                                    </div>
                                    <div style="display: table-cell; width: 50%; padding-left: 10px;">
                                        <div class="stat-box">
                                            <div class="stat-label">Current Streak</div>
                                            <div class="stat-value">${stats.summary.currentStreak} Days</div>
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
