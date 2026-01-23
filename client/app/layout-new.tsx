import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DevMeter - Automatic Coding Time Tracker for Developers",
  description: "Track your coding time automatically with DevMeter. Analyze your development habits, boost productivity, and understand your coding patterns with our VS Code extension.",
  keywords: ["DevMeter", "coding time tracker", "developer productivity", "VS Code extension", "time tracking", "code metrics", "developer analytics"],
  authors: [{ name: "DevMeter Team" }],
  metadataBase: new URL("https://devmeter-v2.zaidcode.me"),
  alternates: {
    canonical: "https://devmeter-v2.zaidcode.me",
  },
  openGraph: {
    title: "DevMeter - Automatic Coding Time Tracker",
    description: "Track your coding activity, monitor productivity, and analyze your development habits automatically.",
    type: "website",
    url: "https://devmeter-v2.zaidcode.me",
    siteName: "DevMeter",
    images: [
      {
        url: "https://devmeter-v2.zaidcode.me/og-image.png",
        width: 1200,
        height: 630,
        alt: "DevMeter - Coding Time Tracker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DevMeter - Coding Time Tracker",
    description: "Automatic coding time tracking and productivity analytics for developers.",
    images: ["https://devmeter-v2.zaidcode.me/og-image.png"],
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "DevMeter",
    url: "https://devmeter-v2.zaidcode.me",
    description: "Automatic coding time tracker and productivity analytics for developers",
    sameAs: [
      "https://github.com/devmeter",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Support",
      email: "support@devmeter.io",
    },
  };

  const softwareAppSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "DevMeter",
    description: "Automatic coding time tracker for VS Code",
    applicationCategory: "DeveloperApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    operatingSystem: "Windows, macOS, Linux",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "150",
    },
  };

  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
