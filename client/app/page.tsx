"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { LandingBackground } from "@/components/landing/landing-background";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingHeroSection } from "@/components/landing/landing-hero-section";
import { LandingFeaturesSection } from "@/components/landing/landing-features-section";
import { LandingStackHighlightsSection } from "@/components/landing/landing-stack-highlights-section";
import { LandingSupportSection } from "@/components/landing/landing-support-section";
import { LandingCtaSection } from "@/components/landing/landing-cta-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LANDING_LINKS } from "@/components/landing/landing-config";
import Link from "next/link";

/**
 * Render the public marketing landing page and redirect authenticated users to the dashboard.
 *
 * The component checks the current authentication session and, if present, navigates to `/dashboard`
 * and renders nothing. If no session exists, it renders the full public landing UI (hero, features,
 * support, CTA, and footer).
 *
 * @returns The landing page JSX element; renders nothing while redirecting authenticated users to `/dashboard`.
 */
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
      <LandingBackground />

      <main className="relative z-10">
        <LandingNavbar
          onHome={() => router.push("/")}
          onSignIn={() => router.push("/auth/sign-in")}
          onSignUp={() => router.push("/auth/sign-up")}
        />
        <div className="mx-auto mt-4 max-w-7xl px-4 md:px-8">
          <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm md:text-base flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="inline-flex items-center rounded-full border border-primary/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                New
              </span>
              <span className="ml-2 font-medium">DevMeter now has a live MCP server for VS Code and other agent tools.</span>
            </div>
            <Link href="/blog/devmeter-now-has-mcp-server" className="font-semibold text-primary hover:underline">
              Read the announcement
            </Link>
          </div>
        </div>
        <LandingHeroSection />
        <LandingFeaturesSection />
        <LandingStackHighlightsSection />
        <LandingSupportSection donateUrl={LANDING_LINKS.donate} />
        <LandingCtaSection />
        <LandingFooter />
      </main>
    </div>
  );
}
