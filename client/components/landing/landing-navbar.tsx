import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LandingNavbarProps {
  onHome: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
}

export function LandingNavbar({ onHome, onSignIn, onSignUp }: LandingNavbarProps) {
  return (
    <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto border-b border-white/5 backdrop-blur-md sticky top-0 bg-black/50">
      <button
        type="button"
        aria-label="Home"
        onClick={onHome}
        className="flex items-center gap-2 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-md"
      >
        <div className="bg-primary p-1.5 rounded-lg rotate-3 group-hover:rotate-12 transition-transform duration-300">
          <Activity className="h-6 w-6 text-black" />
        </div>
        <span className="text-xl font-black tracking-tighter">DevMeter</span>
      </button>
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onSignIn} className="text-sm font-medium hover:text-primary transition-colors">
          Sign In
        </Button>
        <Button onClick={onSignUp} className="bg-white text-black hover:bg-white/90 font-bold rounded-full px-6">
          Get Started
        </Button>
      </div>
    </nav>
  );
}
