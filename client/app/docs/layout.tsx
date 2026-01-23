import { Metadata } from "next";

export const metadata: Metadata = {
  title: "DevMeter Documentation - Get Started with Coding Analytics",
  description: "Complete documentation for DevMeter - Track your coding activity, monitor productivity, and analyze your development habits. Install the VS Code extension and start tracking today.",
  keywords: ["DevMeter", "coding analytics", "developer productivity", "VS Code extension", "time tracking", "code metrics"],
  authors: [{ name: "DevMeter Team" }],
  openGraph: {
    title: "DevMeter Documentation",
    description: "Everything you need to get started with DevMeter - Install, configure, and track your coding activity.",
    type: "website",
    url: "https://devmeter-v2.zaidcode.me/docs",
  },
  twitter: {
    card: "summary_large_image",
    title: "DevMeter Documentation",
    description: "Complete guide to DevMeter - Track your coding activity and boost productivity.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
