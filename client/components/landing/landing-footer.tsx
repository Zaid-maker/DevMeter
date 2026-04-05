import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { LANDING_LINKS } from "@/components/landing/landing-config";

export function LandingFooter() {
  return (
    <footer className="py-12 px-6 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="font-bold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link></li>
              <li><Link href="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
              <li><Link href="/leaderboard" className="hover:text-primary transition-colors">Leaderboard</Link></li>
              <li><a href={LANDING_LINKS.extensionMarketplace} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">VS Code Extension</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/docs" className="hover:text-primary transition-colors">Getting Started</Link></li>
              <li><Link href="/blog/why-wakatime-alternative-devmeter" className="hover:text-primary transition-colors">Why DevMeter?</Link></li>
              <li><Link href="/blog/developer-burnout-early-detection" className="hover:text-primary transition-colors">Avoid Burnout</Link></li>
              <li><a href={LANDING_LINKS.githubRepo} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">GitHub</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
              <li><a href={LANDING_LINKS.discordInvite} target="_blank" rel="noopener noreferrer" className="hover:text-[#5865F2] transition-colors flex items-center gap-2">
                Discord Community
                <Badge variant="outline" className="text-[8px] py-0 px-1 border-[#5865F2]/30 text-[#5865F2]">New</Badge>
              </a></li>
              <li><a href={LANDING_LINKS.x} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">X / Twitter</a></li>
              <li><a href={LANDING_LINKS.supportEmail} className="hover:text-primary transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><a href={LANDING_LINKS.mitLicense} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">License (MIT)</a></li>
            </ul>
          </div>
        </div>

        <div className="text-center pt-8 border-t border-white/5">
          <p className="text-muted-foreground text-sm font-medium">
            © {new Date().getFullYear()} DevMeter. Built with passion for open source.
          </p>
        </div>
      </div>
    </footer>
  );
}
