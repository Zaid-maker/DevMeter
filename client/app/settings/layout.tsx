import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings - DevMeter",
  description: "Configure your DevMeter preferences, API keys, and notification settings.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
