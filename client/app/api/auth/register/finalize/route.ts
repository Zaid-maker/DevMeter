import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { name, email, password, otp } = await req.json();

        if (!name || !email || !password || !otp) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        // 1. Verify OTP
        const identifier = `signup:${email}`;
        const verification = await prisma.verification.findUnique({
            where: { id: identifier }
        });

        if (!verification || verification.value !== otp) {
            return NextResponse.json({ error: "Invalid or expired verification code" }, { status: 400 });
        }

        if (verification.expiresAt < new Date()) {
            return NextResponse.json({ error: "Verification code has expired" }, { status: 400 });
        }

        // 2. Finalize Signup using Better Auth
        // This will create the user, hash the password, and create a session
        const authResponse = await auth.api.signUpEmail({
            body: {
                email,
                password,
                name,
            },
            asResponse: true
        });

        if (!authResponse.ok) {
            return authResponse;
        }

        // 3. Mark user as verified immediately
        await prisma.user.update({
            where: { email },
            data: { emailVerified: true }
        });

        // 4. Delete the verification record
        await prisma.verification.delete({
            where: { id: identifier }
        });

        return authResponse;
    } catch (error: any) {
        console.error("Error finalizing registration:", error);
        return NextResponse.json({
            error: error.message || "Failed to complete registration"
        }, { status: 500 });
    }
}
