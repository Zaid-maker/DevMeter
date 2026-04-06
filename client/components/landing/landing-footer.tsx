import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { LANDING_LINKS } from "@/components/landing/landing-config";

type FooterItem = {
  label: string;
  href: string;
  external?: boolean;
  className?: string;
  badge?: {
    text: string;
    variant: "outline";
    className: string;
  };
};

type FooterSection = {
  title: string;
  items: FooterItem[];
};

const footerSections: FooterSection[] = [
  {
    title: "Product",
    items: [
      { label: "Documentation", href: "/docs" },
      { label: "Blog", href: "/blog" },
      { label: "Leaderboard", href: "/leaderboard" },
      { label: "VS Code Extension", href: LANDING_LINKS.extensionMarketplace, external: true },
    ],
  },
  {
    title: "Resources",
    items: [
      { label: "Getting Started", href: "/docs" },
      { label: "Why DevMeter?", href: "/blog/why-wakatime-alternative-devmeter" },
      { label: "Avoid Burnout", href: "/blog/developer-burnout-early-detection" },
      { label: "GitHub", href: LANDING_LINKS.githubRepo, external: true },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "Blog", href: "/blog" },
      {
        label: "Discord Community",
        href: LANDING_LINKS.discordInvite,
        external: true,
        className: "hover:text-[#5865F2]",
        badge: {
          text: "New",
          variant: "outline",
          className: "text-[8px] py-0 px-1 border-[#5865F2]/30 text-[#5865F2]",
        },
      },
      { label: "X / Twitter", href: LANDING_LINKS.x, external: true },
      { label: "Contact", href: LANDING_LINKS.supportEmail, external: true },
    ],
  },
  {
    title: "Legal",
    items: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "License (MIT)", href: LANDING_LINKS.mitLicense, external: true },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="py-12 px-6 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="font-bold mb-4">{section.title}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {section.items.map((item) => (
                  <li key={item.label}>
                    {item.external ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`transition-colors flex items-center gap-2 ${item.className || "hover:text-primary"}`}
                      >
                        {item.label}
                        {item.badge ? (
                          <Badge variant={item.badge.variant} className={item.badge.className}>{item.badge.text}</Badge>
                        ) : null}
                      </a>
                    ) : (
                      <Link href={item.href} className="hover:text-primary transition-colors">{item.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
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
