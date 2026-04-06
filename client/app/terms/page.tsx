import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Scale, ShieldCheck, AlertTriangle, Clock, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service | DevMeter",
  description: "Read the terms that govern use of DevMeter services and platform.",
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://devmeter-v2.zaidcode.me/terms",
  },
};

const LAST_UPDATED = "April 6, 2026";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-4xl px-4 py-16 md:px-6 md:py-24">
        <div className="mb-10 space-y-4">
          <p className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
            <FileText className="mr-2 h-3.5 w-3.5" /> Terms of Service
          </p>
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">Terms That Govern DevMeter</h1>
          <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
            These Terms of Service describe your rights and responsibilities when using DevMeter.
            By accessing or using DevMeter, you agree to these terms.
          </p>
          <p className="inline-flex items-center text-xs text-muted-foreground md:text-sm">
            <Clock className="mr-2 h-4 w-4" /> Last updated: {LAST_UPDATED}
          </p>
        </div>

        <div className="space-y-8 rounded-3xl border border-white/10 bg-white/5 p-6 md:p-10">
          <section className="space-y-3">
            <h2 className="inline-flex items-center text-2xl font-bold tracking-tight">
              <Scale className="mr-2 h-5 w-5 text-primary" /> 1. Acceptance of Terms
            </h2>
            <p className="text-sm text-muted-foreground md:text-base">
              By creating an account, installing the extension, or otherwise using DevMeter, you agree to be bound by these Terms.
              If you do not agree, do not use the service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="inline-flex items-center text-2xl font-bold tracking-tight">
              <ShieldCheck className="mr-2 h-5 w-5 text-primary" /> 2. Account and Security
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground md:text-base">
              <li>You are responsible for your account credentials and API keys.</li>
              <li>You must provide accurate account information and keep it updated.</li>
              <li>You are responsible for activity that occurs under your account.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight">3. Acceptable Use</h2>
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground md:text-base">
              <li>Do not use DevMeter for unlawful, abusive, or fraudulent activity.</li>
              <li>Do not attempt to disrupt, overload, or compromise the platform.</li>
              <li>Do not reverse engineer or misuse private APIs beyond permitted use.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight">4. Service Availability and Changes</h2>
            <p className="text-sm text-muted-foreground md:text-base">
              DevMeter may evolve over time. We may update, suspend, or discontinue features with or without notice.
              We do not guarantee uninterrupted availability of the service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="inline-flex items-center text-2xl font-bold tracking-tight">
              <AlertTriangle className="mr-2 h-5 w-5 text-primary" /> 5. Disclaimer and Limitation of Liability
            </h2>
            <p className="text-sm text-muted-foreground md:text-base">
              DevMeter is provided "as is" and "as available" without warranties of any kind.
              To the maximum extent permitted by law, DevMeter and its contributors are not liable for indirect,
              incidental, special, consequential, or punitive damages arising from your use of the service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight">6. Termination</h2>
            <p className="text-sm text-muted-foreground md:text-base">
              We may suspend or terminate access to DevMeter if these terms are violated, if abuse is detected,
              or when required for platform security and legal compliance.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="inline-flex items-center text-2xl font-bold tracking-tight">
              <Mail className="mr-2 h-5 w-5 text-primary" /> 7. Contact
            </h2>
            <p className="text-sm text-muted-foreground md:text-base">
              For legal or terms-related inquiries, contact <a href="mailto:support@devmeter.io" className="font-semibold text-primary hover:underline">support@devmeter.io</a>.
            </p>
          </section>
        </div>

        <div className="mt-8 flex items-center gap-4">
          <Link href="/" className="text-sm font-semibold text-primary hover:underline">
            Back to Home
          </Link>
          <Link href="/privacy" className="text-sm font-semibold text-primary hover:underline">
            View Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
