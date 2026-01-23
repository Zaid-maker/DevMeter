import { Metadata } from "next";

export const metadata: Metadata = {
  title: "DevMeter Blog - Coding Productivity & Developer Analytics",
  description: "Read insights about coding productivity, developer habits, time tracking, and how to boost your development workflow with DevMeter.",
  keywords: ["developer blog", "coding productivity", "time tracking tips", "developer habits", "VS Code extensions"],
  authors: [{ name: "DevMeter Team" }],
  alternates: {
    canonical: "https://devmeter-v2.zaidcode.me/blog",
  },
  openGraph: {
    title: "DevMeter Blog",
    description: "Learn about productivity, coding analytics, and developer best practices.",
    type: "website",
    url: "https://devmeter-v2.zaidcode.me/blog",
    images: [
      {
        url: "https://devmeter-v2.zaidcode.me/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
