import { Activity, Clock, Code, Cpu, Globe, MousePointer2 } from "lucide-react";

export function LandingStackHighlightsSection() {
  return (
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
  );
}
