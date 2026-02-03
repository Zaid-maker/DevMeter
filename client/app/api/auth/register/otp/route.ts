import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        // 1. Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json({ error: "User already exists" }, { status: 400 });
        }

        // 2. Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // 3. Store in Verification table
        // We use a prefix to identify signup OTPs
        const identifier = `signup:${email}`;

        await prisma.verification.upsert({
            where: { id: identifier },
            update: {
                value: otp,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
            },
            create: {
                id: identifier,
                identifier: email,
                value: otp,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000)
            }
        });

        // 4. Send Email
        const emailFrom = process.env.EMAIL_FROM || "onboarding@resend.dev";

        if (resend) {
            const { error } = await resend.emails.send({
                from: emailFrom,
                to: email,
                subject: "Verify your email - DevMeter",
                html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta name="color-scheme" content="light dark">
                    <style>
                        :root { color-scheme: light dark; }
                        body { background-color: #ffffff; color: #000000; font-family: sans-serif; margin: 0; padding: 0; }
                        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
                        .card { background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 16px; padding: 40px; text-align: center; }
                        .logo { font-size: 24px; font-weight: 900; margin-bottom: 32px; }
                        .title { font-size: 24px; font-weight: 800; margin-bottom: 16px; }
                        .otp-container { background-color: #000000; color: #ffffff !important; padding: 20px; border-radius: 12px; font-size: 32px; font-weight: 800; letter-spacing: 0.2em; display: inline-block; margin: 24px 0; }
                        .footer { margin-top: 32px; font-size: 14px; color: #6b7280; }
                        @media (prefers-color-scheme: dark) {
                            body { background-color: #000000 !important; color: #ffffff !important; }
                            .card { background-color: #0a0a0a !important; border-color: #1f2937 !important; }
                            .otp-container { background-color: #ffffff !important; color: #000000 !important; }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="card">
                            <div class="logo">DevMeter</div>
                            <h1 class="title">Verification Code</h1>
                            <p>To complete your registration, use the code below to verify your email.</p>
                            <div class="otp-container">${otp}</div>
                            <p class="footer">If you didn't request this, you can safely ignore this email.</p>
                        </div>
                    </div>
                </body>
                </html>
                `
            });

            if (error) {
                console.error("Resend error:", error);
                throw new Error(error.message || "Failed to send email");
            }
        } else {
            console.log(`[DEV] OTP for ${email}: ${otp}`);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error sending signup OTP:", error);
        return NextResponse.json({ error: "Failed to send verification code" }, { status: 500 });
    }
}
