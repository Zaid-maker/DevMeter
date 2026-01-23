import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile - DevMeter",
  description: "Manage your DevMeter profile and view your coding achievements and statistics.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
