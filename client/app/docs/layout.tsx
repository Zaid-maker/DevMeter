import { Metadata } from "next";

export const metadata: Metadata = {
  title: "DevMeter Documentation - Get Started with Coding Analytics",
  description: "Complete documentation for DevMeter - Track your coding activity, monitor productivity, and analyze your development habits. Install the VS Code extension and start tracking today.",
  keywords: ["DevMeter", "coding analytics", "developer productivity", "VS Code extension", "time tracking", "code metrics"],
  authors: [{ name: "DevMeter Team" }],
  alternates: {
    canonical: "https://devmeter-v2.zaidcode.me/docs",
  },
  openGraph: {
    title: "DevMeter Documentation",
    description: "Everything you need to get started with DevMeter - Install, configure, and track your coding activity.",
    type: "website",
    url: "https://devmeter-v2.zaidcode.me/docs",
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
    title: "DevMeter Documentation",
    description: "Complete guide to DevMeter - Track your coding activity and boost productivity.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
    },
  },
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is DevMeter?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "DevMeter is an automatic coding time tracker for VS Code that monitors your development activity and provides productivity insights.",
        },
      },
      {
        "@type": "Question",
        name: "How do I install DevMeter?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You can install DevMeter from the VS Code Extensions marketplace, Open-VSX registry, or using the command line.",
        },
      },
      {
        "@type": "Question",
        name: "Is DevMeter free?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, DevMeter is completely free with no limitations on features or tracking time.",
        },
      },
    ],
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://devmeter-v2.zaidcode.me",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Documentation",
        item: "https://devmeter-v2.zaidcode.me/docs",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
