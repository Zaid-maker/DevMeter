import { Github } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface LandingSupportSectionProps {
  donateUrl: string;
}

export function LandingSupportSection({ donateUrl }: LandingSupportSectionProps) {
  void donateUrl;

  return (
    <section className="py-16 px-6 border-t border-white/5">
      <div className="max-w-4xl mx-auto rounded-3xl border border-primary/20 bg-linear-to-r from-primary/10 via-blue-500/10 to-transparent p-8 md:p-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10 w-fit">Open-Source Community</Badge>
            <h3 className="text-2xl md:text-3xl font-black tracking-tight">Support community-driven DevMeter</h3>
            <p className="text-muted-foreground max-w-2xl">
              If DevMeter helps your workflow, consider donating. Your support helps us maintain the project, ship improvements, and keep DevMeter healthy for the open-source community.
            </p>
          </div>
          <Button
            size="lg"
            disabled
            title="Support approval pending"
            className="bg-primary/50 text-black/60 hover:bg-primary/50 font-black rounded-full px-8 w-full md:w-auto cursor-not-allowed"
          >
            Support Project (Coming Soon) <Github className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
}
