import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developer Leaderboard - Top Coding Time Trackers | DevMeter",
  description: "Check the DevMeter leaderboard to see top developers, compare coding activity, and compete with the developer community. See who's coding the most!",
  keywords: ["developer leaderboard", "coding leaderboard", "programming competition", "developer rankings", "coding stats"],
  alternates: {
    canonical: "https://devmeter-v2.zaidcode.me/leaderboard",
  },
  openGraph: {
    title: "Developer Leaderboard - DevMeter",
    description: "See top developers and compare your coding activity with the community.",
    type: "website",
    url: "https://devmeter-v2.zaidcode.me/leaderboard",
    siteName: "DevMeter",
    images: [
      {
        url: "https://devmeter-v2.zaidcode.me/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Developer Leaderboard - DevMeter",
    description: "Check out top developers and coding activity rankings.",
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

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
