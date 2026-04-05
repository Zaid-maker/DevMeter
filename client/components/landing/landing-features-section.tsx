import { LucideIcon, BarChart3, Shield, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
}

function FeatureCard({ icon: Icon, title, description, color }: FeatureCardProps) {
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

export function LandingFeaturesSection() {
  return (
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
  );
}
