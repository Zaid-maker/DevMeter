import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MainNav } from "@/components/dashboard/main-nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DevMeter - Automatic Coding Time Tracker for Developers",
  description: "Track your coding time automatically with DevMeter. Analyze your development habits, boost productivity, and understand your coding patterns with our VS Code extension.",
  keywords: ["DevMeter", "coding time tracker", "developer productivity", "VS Code extension", "time tracking", "code metrics", "developer analytics"],
  authors: [{ name: "DevMeter Team" }],
  metadataBase: new URL("https://devmeter-v2.zaidcode.me"),
  openGraph: {
    title: "DevMeter - Automatic Coding Time Tracker",
    description: "Track your coding activity, monitor productivity, and analyze your development habits automatically.",
    type: "website",
    url: "https://devmeter-v2.zaidcode.me",
    siteName: "DevMeter",
  },
  twitter: {
    card: "summary_large_image",
    title: "DevMeter - Coding Time Tracker",
    description: "Automatic coding time tracking and productivity analytics for developers.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
};

import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background`}>
        <MainNav />
        <main>{children}</main>
        <Toaster position="bottom-right" closeButton richColors expand={false} />
      </body>
    </html>
  );
}
