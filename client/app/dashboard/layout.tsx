import { Metadata } from "next";

// Prevent stale static HTML referencing old JS chunks after rebuilds
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard - DevMeter",
  description: "View your coding activity, statistics, and productivity metrics. Track your development habits and improve your workflow.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
