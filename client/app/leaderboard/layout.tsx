import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard - DevMeter",
  description: "Check the DevMeter leaderboard to see top developers and compare your coding activity with the community.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
