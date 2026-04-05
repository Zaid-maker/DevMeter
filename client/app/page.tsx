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

const DONATE_URL = "https://github.com/sponsors/DevMitrza";

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
        <LandingHeroSection />
        <LandingFeaturesSection />
        <LandingStackHighlightsSection />
        <LandingSupportSection donateUrl={DONATE_URL} />
        <LandingCtaSection />
        <LandingFooter />
      </main>
    </div>
  );
}
