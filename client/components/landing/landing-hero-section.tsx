import Link from "next/link";
import { ArrowRight, Download, Terminal, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function LandingHeroSection() {
  return (
    <section className="pt-10 md:pt-16 pb-12 md:pb-20 px-4 md:px-6 max-w-7xl mx-auto text-center overflow-hidden">
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
        <Button size="lg" asChild className="h-14 px-10 text-lg bg-primary text-black hover:bg-primary/90 font-black rounded-full w-full sm:w-auto shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]">
          <a href="https://marketplace.visualstudio.com/items?itemName=DevMitrza.devmeter" target="_blank" rel="noopener noreferrer">
            Install Extension <Download className="ml-2 h-5 w-5" />
          </a>
        </Button>
        <Button variant="outline" size="lg" asChild className="h-14 px-10 text-lg border-white/10 hover:bg-white/5 rounded-full w-full sm:w-auto font-bold text-white">
          <Link href="/auth/sign-up">
            Start Tracking <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>

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
  );
}
