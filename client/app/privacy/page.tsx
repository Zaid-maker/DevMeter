import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Database, Lock, Mail, Eye, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | DevMeter",
  description:
    "Read how DevMeter collects, uses, stores, and protects your data.",
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://devmeter-v2.zaidcode.me/privacy",
  },
};

const LAST_UPDATED = "April 6, 2026";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-4xl px-4 py-16 md:px-6 md:py-24">
        <div className="mb-10 space-y-4">
          <p className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
            <ShieldCheck className="mr-2 h-3.5 w-3.5" /> Privacy Policy
          </p>
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">Your Privacy Matters</h1>
          <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
            This Privacy Policy explains what data DevMeter collects, why we collect it, and how we protect it.
            By using DevMeter, you agree to the practices described below.
          </p>
          <p className="inline-flex items-center text-xs text-muted-foreground md:text-sm">
            <Clock className="mr-2 h-4 w-4" /> Last updated: {LAST_UPDATED}
          </p>
        </div>

        <div className="space-y-8 rounded-3xl border border-white/10 bg-white/5 p-6 md:p-10">
          <section className="space-y-3">
            <h2 className="inline-flex items-center text-2xl font-bold tracking-tight">
              <Database className="mr-2 h-5 w-5 text-primary" /> 1. Data We Collect
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground md:text-base">
              <li>Account details such as name, email, and authentication metadata.</li>
              <li>Coding activity data sent by the DevMeter extension, including project, language, file path metadata, editor, platform, and timestamps.</li>
              <li>Technical and security logs required to keep the service stable and secure.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="inline-flex items-center text-2xl font-bold tracking-tight">
              <Eye className="mr-2 h-5 w-5 text-primary" /> 2. How We Use Data
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground md:text-base">
              <li>Provide dashboards, leaderboard rankings, profile views, and coding insights.</li>
              <li>Operate core features such as API key authentication and account management.</li>
              <li>Improve reliability, detect abuse, and troubleshoot platform issues.</li>
              <li>Communicate important updates related to your account or service health.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="inline-flex items-center text-2xl font-bold tracking-tight">
              <Lock className="mr-2 h-5 w-5 text-primary" /> 3. Data Sharing and Disclosure
            </h2>
            <p className="text-sm text-muted-foreground md:text-base">
              We do not sell your personal data. We may share limited data with trusted infrastructure providers
              that help us run DevMeter (for example database, hosting, and email providers), strictly for service operation.
              We may also disclose information when required by law or to protect users and the platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight">4. Retention and Security</h2>
            <p className="text-sm text-muted-foreground md:text-base">
              We retain data only as long as needed for product functionality, legal obligations, and abuse prevention.
              DevMeter applies industry-standard security measures, but no internet service can guarantee absolute security.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight">5. Your Controls</h2>
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground md:text-base">
              <li>Update profile details and settings in your account dashboard.</li>
              <li>Delete or deactivate your account from account settings where available.</li>
              <li>Contact us for privacy-related requests or clarification.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="inline-flex items-center text-2xl font-bold tracking-tight">
              <Mail className="mr-2 h-5 w-5 text-primary" /> 6. Contact
            </h2>
            <p className="text-sm text-muted-foreground md:text-base">
              Questions about this policy can be sent to <a href="mailto:support@devmeter.io" className="font-semibold text-primary hover:underline">support@devmeter.io</a>.
            </p>
          </section>
        </div>

        <div className="mt-8">
          <Link href="/" className="text-sm font-semibold text-primary hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
