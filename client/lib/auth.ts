import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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
            const { error } = await resend.emails.send({
                from: process.env.EMAIL_FROM || "onboarding@resend.dev",
                to: user.email,
                subject: "Verify your email",
                html: `<p>Please verify your email by clicking <a href="${url}">here</a>.</p>`,
            });

            if (error) {
                console.error("Failed to send verification email:", error);
            }
        },
    },
});
