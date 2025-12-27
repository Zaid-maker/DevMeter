"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Activity,
  Clock,
  Code,
  Zap,
  Shield,
  Globe,
  BarChart3,
  Github,
  ArrowRight,
  MousePointer2,
  Terminal,
  Cpu
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  // Redirect if already logged in
  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  if (session) return null;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary/30 selection:text-primary overflow-x-hidden">
      {/* Background gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <main className="relative z-10">
        {/* Navbar */}
        <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto border-b border-white/5 backdrop-blur-md sticky top-0 bg-black/50">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => router.push("/")}>
            <div className="bg-primary p-1.5 rounded-lg rotate-3 group-hover:rotate-12 transition-transform duration-300">
              <Activity className="h-6 w-6 text-black" />
            </div>
            <span className="text-xl font-black tracking-tighter">DevMeter</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push("/auth/sign-in")} className="text-sm font-medium hover:text-primary transition-colors">
              Sign In
            </Button>
            <Button onClick={() => router.push("/auth/sign-up")} className="bg-white text-black hover:bg-white/90 font-bold rounded-full px-6">
              Get Started
            </Button>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-16 md:pt-24 pb-12 md:pb-20 px-4 md:px-6 max-w-7xl mx-auto text-center overflow-hidden">
          <Badge variant="outline" className="mb-6 py-1 px-4 border-primary/20 bg-primary/5 text-primary animate-bounce text-[10px] md:text-sm">
            <Zap className="h-3 w-3 mr-2" /> 100% Open Source
          </Badge>
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-6 md:mb-8 leading-[1.05] md:leading-[1.1]">
            Master your <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-400 to-primary bg-[length:200%_auto] animate-gradient">craft.</span><br className="hidden md:block" />
            Track every <span className="text-primary/90 italic">stroke.</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-2xl max-w-2xl mx-auto mb-10 md:mb-12 font-medium leading-relaxed px-2">
            The ultimate automated coding time tracker for elite developers. Get deep insights into your productivity without lifting a finger.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Button size="lg" onClick={() => router.push("/auth/sign-up")} className="h-14 px-10 text-lg bg-primary text-black hover:bg-primary/90 font-black rounded-full w-full sm:w-auto shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]">
              Start Tracking Now <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" asChild className="h-14 px-10 text-lg border-white/10 hover:bg-white/5 rounded-full w-full sm:w-auto font-bold">
              <a href="https://github.com/Zaid-maker/DevMeter" target="_blank" rel="noopener noreferrer">
                <Github className="mr-2 h-5 w-5" /> View on GitHub
              </a>
            </Button>
          </div>

          {/* Code Visual Mockup */}
          <div className="relative max-w-4xl mx-auto group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-blue-500/50 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <Card className="relative bg-[#0d0d0d] border-white/10 overflow-hidden rounded-2xl flex flex-col items-center justify-center p-8 md:p-12">
              <div className="w-full flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/50" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/50" />
                  <div className="h-3 w-3 rounded-full bg-green-500/50" />
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono bg-white/5 px-3 py-1 rounded-full">
                  <Terminal className="h-3 w-3" /> dev-meter heartbeat_v1.sh
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                <div className="space-y-1 text-left">
                  <p className="text-[10px] text-primary font-mono uppercase tracking-widest opacity-70">Tracking Live</p>
                  <p className="text-3xl md:text-4xl font-black">4h 32m</p>
                  <p className="text-[10px] text-muted-foreground">Recorded today</p>
                </div>
                <div className="space-y-1 text-left">
                  <p className="text-[10px] text-blue-400 font-mono uppercase tracking-widest opacity-70">Top Stack</p>
                  <p className="text-3xl md:text-4xl font-black">Typescript</p>
                  <p className="text-[10px] text-muted-foreground">84% of workload</p>
                </div>
                <div className="space-y-1 text-left">
                  <p className="text-[10px] text-green-400 font-mono uppercase tracking-widest opacity-70">Weekly Growth</p>
                  <p className="text-3xl md:text-4xl font-black text-green-400">+12%</p>
                  <p className="text-[10px] text-muted-foreground">Up from last week</p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-32 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter">Engineered for Transparency.</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              DevMeter isn't just a tool; it's a statement. Open source, privacy-focused, and developer-first.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Zap}
              title="Automated Precision"
              description="Record your focus time without lifting a finger. Our extension handles everything silently."
              color="text-primary"
            />
            <FeatureCard
              icon={BarChart3}
              title="Deep Visuals"
              description="Understand your habits with vibrant charts, language breakdowns, and project intensity stats."
              color="text-blue-400"
            />
            <FeatureCard
              icon={Shield}
              title="Audit-Ready"
              description="100% open-source software. Verify exactly how your data is handled from heartbeats to dashboard."
              color="text-green-400"
            />
          </div>
        </section>

        {/* Stack Highlights */}
        <section className="py-24 border-t border-white/5 bg-white/[0.02]">
          <div className="max-w-7xl mx-auto px-6 overflow-hidden">
            <p className="text-center text-xs font-mono text-muted-foreground uppercase tracking-widest mb-12">Universal Language Support</p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
              <Cpu className="h-10 w-10" />
              <MousePointer2 className="h-10 w-10" />
              <Code className="h-10 w-10" />
              <Globe className="h-10 w-10" />
              <Activity className="h-10 w-10" />
              <Clock className="h-10 w-10" />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-6 text-center">
          <div className="max-w-4xl mx-auto bg-primary rounded-[3rem] p-12 md:p-20 text-black relative overflow-hidden group">
            <div className="absolute top-0 right-0 h-40 w-40 bg-white/20 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-1000" />
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-8 leading-tight">Ready to verify<br /> your intensity?</h2>
            <Button size="lg" onClick={() => router.push("/auth/sign-up")} className="bg-black text-white hover:bg-black/90 font-black px-10 h-16 text-xl rounded-full">
              Join DevMeter Free
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-6 border-t border-white/5 text-center">
          <p className="text-muted-foreground text-sm font-medium">
            © {new Date().getFullYear()} DevMeter. Built with passion for open source.
          </p>
        </footer>
      </main>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, color }: any) {
  return (
    <Card className="bg-white/5 border-white/5 p-8 hover:bg-white/10 transition-colors group relative overflow-hidden">
      <div className={`p-3 rounded-2xl bg-white/5 w-fit mb-6 ${color} group-hover:scale-110 transition-transform`}>
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </Card>
  );
}
