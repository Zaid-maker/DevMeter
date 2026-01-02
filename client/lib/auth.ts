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
                html: `<p>Please verify your email by clicking <a href="${url}">here</a>.</p>`,
            });

            if (error) {
                console.error("Failed to send verification email:", error);
                throw error;
            }
        },
    },
});
