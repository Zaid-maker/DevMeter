import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication - DevMeter",
  description: "Sign in or create your DevMeter account to start tracking your coding activity.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
