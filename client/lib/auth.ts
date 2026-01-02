import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM;

if (process.env.NODE_ENV === "production") {
    if (!resendApiKey) {
        throw new Error("RESEND_API_KEY is missing. Production environment requires a valid Resend API key.");
    }
    if (!emailFrom) {
        throw new Error("EMAIL_FROM is missing. Production environment requires a verified sender email address.");
    }
}

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true
    },
    emailVerification: {
        sendOnSignUp: true,
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
                    <style>
                        body { background-color: #000000; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; }
                        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
                        .card { background-color: #0a0a0a; border: 1px solid #1f2937; border-radius: 16px; padding: 40px; text-align: center; }
                        .logo { font-size: 24px; font-weight: 900; color: #ffffff; margin-bottom: 32px; letter-spacing: -0.05em; }
                        .primary-color { color: hsl(var(--primary)); } /* Note: Standard email clients won't support CSS variables, using hex fallback */
                        .accent { color: #facc15; }
                        .title { font-size: 32px; font-weight: 800; margin-bottom: 16px; letter-spacing: -0.05em; line-height: 1.1; }
                        .description { font-size: 16px; color: #9ca3af; line-height: 1.6; margin-bottom: 32px; }
                        .button { background-color: #ffffff; color: #000000 !important; padding: 16px 40px; border-radius: 100px; text-decoration: none; font-weight: 700; display: inline-block; transition: opacity 0.2s; }
                        .footer { margin-top: 40px; font-size: 12px; color: #4b5563; line-height: 1.5; }
                        .divider { height: 1px; background-color: #1f2937; margin: 32px 0; }
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
