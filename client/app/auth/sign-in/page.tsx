"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Activity, ArrowRight, Github } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignInPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSignIn(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            await authClient.signIn.email({
                email,
                password,
            }, {
                onSuccess: () => router.push("/dashboard"),
                onError: (ctx) => alert(ctx.error.message || "Sign in failed"),
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary/30 selection:text-primary flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background gradients */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                <div className="flex flex-col items-center mb-10 space-y-4">
                    <div className="bg-primary p-2 rounded-xl rotate-3">
                        <Activity className="h-8 w-8 text-black" />
                    </div>
                    <h2 className="text-3xl font-black tracking-tighter">Welcome back.</h2>
                    <p className="text-muted-foreground font-medium">Continue your streak on DevMeter.</p>
                </div>

                <Card className="bg-white/[0.03] border-white/10 backdrop-blur-xl shadow-2xl rounded-[2rem] overflow-hidden">
                    <CardHeader className="pt-8 px-8 pb-4">
                        <CardTitle className="text-xl font-bold text-white">Sign In</CardTitle>
                        <CardDescription className="text-muted-foreground">Enter your credentials to access your pulse.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSignIn}>
                        <CardContent className="space-y-4 px-8 pb-6">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-primary focus:border-primary px-4"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between ml-1">
                                    <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Password</Label>
                                    <Link href="#" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">Forgot password?</Link>
                                </div>
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
                                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <><ArrowRight className="mr-2 h-5 w-5" /> Sign In</>}
                            </Button>

                            <p className="text-sm text-center text-muted-foreground pt-4">
                                New to DevMeter?{" "}
                                <Link href="/auth/sign-up" className="text-primary font-bold hover:underline">Create an Account</Link>
                            </p>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
