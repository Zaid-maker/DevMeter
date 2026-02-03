"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Activity, Sparkles, Github, ArrowRight, ShieldCheck, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { toast } from "sonner";

export default function SignUpPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const canResend = countdown === 0;

    async function handleSignUp(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("/api/auth/register/otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to send code");
            }

            toast.success("Verification code sent!", {
                description: "Please check your email to continue.",
            });
            setIsOtpSent(true);
            setCountdown(60);
        } catch (error: any) {
            toast.error("Sign up failed", {
                description: error.message || "Please check your information.",
            });
        } finally {
            setLoading(false);
        }
    }

    async function handleVerifyOtp(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("/api/auth/register/finalize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, otp }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Verification failed");
            }

            toast.success("Account created!", {
                description: "Welcome to DevMeter. Your journey begins now.",
            });

            // Refresh the page or redirect to ensure session is loaded
            window.location.href = "/dashboard";
        } catch (error: any) {
            toast.error("Verification failed", {
                description: error.message || "Invalid or expired code.",
            });
        } finally {
            setLoading(false);
        }
    }

    async function handleResendOtp() {
        if (!canResend) return;
        setLoading(true);
        try {
            const res = await fetch("/api/auth/register/otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to resend code");
            }

            toast.success("New code sent!", {
                description: "Please check your inbox.",
            });
            setCountdown(60);
            setOtp("");
        } catch (error: any) {
            toast.error("Failed to resend code", {
                description: error.message || "Try again later.",
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary/30 selection:text-primary flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background gradients */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                <div className="flex flex-col items-center mb-10 space-y-4">
                    <div className="bg-primary p-2 rounded-xl rotate-3">
                        <Activity className="h-8 w-8 text-black" />
                    </div>
                    <h2 className="text-3xl font-black tracking-tighter">Start your journey.</h2>
                    <p className="text-muted-foreground font-medium text-center">Join the elite circle of developers tracking their progress.</p>
                </div>

                <Card className="bg-white/[0.03] border-white/10 backdrop-blur-xl shadow-2xl rounded-[2rem] overflow-hidden">
                    {!isOtpSent ? (
                        <>
                            <CardHeader className="pt-8 px-8 pb-4">
                                <CardTitle className="text-xl font-bold text-white flex items-center">
                                    Create Account <Sparkles className="ml-2 h-4 w-4 text-primary" />
                                </CardTitle>
                                <CardDescription className="text-muted-foreground">Setup your profile and get your first API key.</CardDescription>
                            </CardHeader>
                            <form onSubmit={handleSignUp}>
                                <CardContent className="space-y-4 px-8 pb-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                                        <Input
                                            id="name"
                                            placeholder="John Doe"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-primary focus:border-primary px-4"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="m@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-primary focus:border-primary px-4"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Password</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-primary focus:border-primary px-4"
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter className="flex flex-col space-y-4 px-8 pb-10">
                                    <Button className="w-full bg-primary text-black hover:bg-primary/90 font-black h-12 rounded-xl shadow-lg shadow-primary/10 transition-all active:scale-95" type="submit" disabled={loading}>
                                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <><ArrowRight className="mr-2 h-5 w-5" /> Get Started Free</>}
                                    </Button>

                                    <p className="text-sm text-center text-muted-foreground pt-4">
                                        Already have an account?{" "}
                                        <Link href="/auth/sign-in" className="text-primary font-bold hover:underline">Sign In</Link>
                                    </p>
                                </CardFooter>
                            </form>
                        </>
                    ) : (
                        <>
                            <CardHeader className="pt-8 px-8 pb-4">
                                <CardTitle className="text-xl font-bold text-white flex items-center">
                                    Verify Email <ShieldCheck className="ml-2 h-4 w-4 text-primary" />
                                </CardTitle>
                                <CardDescription className="text-muted-foreground">We've sent a 6-digit code to <span className="text-white font-medium">{email}</span></CardDescription>
                            </CardHeader>
                            <form onSubmit={handleVerifyOtp}>
                                <CardContent className="space-y-4 px-8 pb-6 font-mono">
                                    <div className="space-y-2 text-center">
                                        <Label htmlFor="otp" className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 block">Verification Code</Label>
                                        <Input
                                            id="otp"
                                            placeholder="000000"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            required
                                            maxLength={6}
                                            className="bg-white/5 border-white/10 h-16 rounded-xl focus:ring-primary focus:border-primary px-4 text-center text-2xl tracking-[0.5em] font-black"
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter className="flex flex-col space-y-4 px-8 pb-10">
                                    <Button className="w-full bg-primary text-black hover:bg-primary/90 font-black h-12 rounded-xl shadow-lg shadow-primary/10 transition-all active:scale-95" type="submit" disabled={loading}>
                                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <><ShieldCheck className="mr-2 h-5 w-5" /> Verify & Continue</>}
                                    </Button>

                                    <div className="flex flex-col items-center space-y-4">
                                        <button
                                            type="button"
                                            onClick={handleResendOtp}
                                            disabled={!canResend || loading}
                                            className="text-sm font-bold text-primary hover:underline disabled:text-muted-foreground disabled:no-underline transition-all"
                                        >
                                            {canResend ? "Resend Code" : `Resend in ${countdown}s`}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsOtpSent(false);
                                                setCountdown(0);
                                            }}
                                            className="text-sm text-muted-foreground hover:text-white transition-colors"
                                        >
                                            Wrong email? <span className="underline">Go back</span>
                                        </button>
                                    </div>
                                </CardFooter>
                            </form>
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
}
