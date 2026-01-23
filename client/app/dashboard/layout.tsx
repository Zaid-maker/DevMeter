import { Metadata } from "next";

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
