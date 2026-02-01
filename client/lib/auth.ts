import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM;

const isResendConfigured = resendApiKey && !resendApiKey.startsWith("re_placeholder");

export const resend = isResendConfigured ? new Resend(resendApiKey) : null;

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    user: {
        additionalFields: {
            timezone: {
                type: "string",
                defaultValue: "UTC",
            },
            deletedAt: {
                type: "date",
                required: false,
            },
            username: {
                type: "string",
                required: false,
            },
            publicProfile: {
                type: "boolean",
                defaultValue: false,
            },
            githubUrl: {
                type: "string",
                required: false,
            },
            linkedinUrl: {
                type: "string",
                required: false,
            },
            hideProjects: {
                type: "boolean",
                defaultValue: false,
            }
        }
    },
    emailAndPassword: {
        enabled: true,
        async sendResetPassword({ user, url }) {
            if (!resend) {
                console.warn("Resend client not initialized. Skipping reset email.");
                return;
            }
            const { error } = await resend.emails.send({
                from: emailFrom || "onboarding@resend.dev",
                to: user.email,
                subject: "Reset your password",
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
                        .button { background-color: #000000; color: #ffffff !important; padding: 14px 32px; border-radius: 100px; text-decoration: none; font-weight: 700; display: inline-block; }
                        @media (prefers-color-scheme: dark) {
                            body { background-color: #000000 !important; color: #ffffff !important; }
                            .card { background-color: #0a0a0a !important; border-color: #1f2937 !important; }
                            .button { background-color: #ffffff !important; color: #000000 !important; }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="card">
                            <div class="logo">DevMeter</div>
                            <h1 class="title">Reset your password.</h1>
                            <p>Click the button below to set a new password for your DevMeter account. This link will expire in 1 hour.</p>
                            <a href="${url}" class="button">Reset Password</a>
                        </div>
                    </div>
                </body>
                </html>
                `,
            });
            if (error) {
                console.error("Failed to send reset email:", error);
                throw error;
            }
        },
    },
    emailVerification: {
        sendOnSignUp: !!resend,
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, url }) => {
            if (!resend) {
                console.warn("Resend client not initialized. Skipping verification email.");
                return;
            }
            const { error } = await resend.emails.send({
                from: emailFrom || "onboarding@resend.dev",
                to: user.email,
                subject: "Verify your email",
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
                        .card { 
                            background-color: #f9fafb; 
                            border: 1px solid #e5e7eb; 
                            border-radius: 16px; 
                            padding: 40px; 
                            text-align: center; 
                        }
                        .logo { 
                            font-size: 24px; 
                            font-weight: 900; 
                            color: #000000; 
                            margin-bottom: 32px; 
                            letter-spacing: -0.05em; 
                        }
                        .accent { color: #facc15; }
                        .title { 
                            font-size: 32px; 
                            font-weight: 800; 
                            margin-bottom: 16px; 
                            letter-spacing: -0.05em; 
                            line-height: 1.1; 
                            color: #000000;
                        }
                        .description { 
                            font-size: 16px; 
                            color: #4b5563; 
                            line-height: 1.6; 
                            margin-bottom: 32px; 
                        }
                        .button { 
                            background-color: #000000; 
                            color: #ffffff !important; 
                            padding: 16px 40px; 
                            border-radius: 100px; 
                            text-decoration: none; 
                            font-weight: 700; 
                            display: inline-block; 
                        }
                        .footer { 
                            margin-top: 40px; 
                            font-size: 12px; 
                            color: #6b7280; 
                            line-height: 1.5; 
                        }
                        .divider { 
                            height: 1px; 
                            background-color: #e5e7eb; 
                            margin: 32px 0; 
                        }

                        @media (prefers-color-scheme: dark) {
                            body { background-color: #000000 !important; color: #ffffff !important; }
                            .card { background-color: #0a0a0a !important; border-color: #1f2937 !important; }
                            .logo { color: #ffffff !important; }
                            .title { color: #ffffff !important; }
                            .description { color: #9ca3af !important; }
                            .button { background-color: #ffffff !important; color: #000000 !important; }
                            .divider { background-color: #1f2937 !important; }
                            .footer { color: #4b5563 !important; }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="card">
                            <div class="logo">DevMeter</div>
                            <h1 class="title">Verify your <span class="accent">intensity.</span></h1>
                            <p class="description">Ready to master your craft? Click the button below to verify your email and start tracking every stroke automatically.</p>
                            <a href="${url}" class="button">Verify My Email</a>
                            <div class="divider"></div>
                            <div class="footer">
                                <p>If you didn't create an account, you can safely ignore this email.</p>
                                <p>&copy; ${new Date().getFullYear()} DevMeter. Engineered for transparency.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
                `,
            });

            if (error) {
                console.error("Failed to send verification email:", error);
                throw error;
            }
        },
    },
});
