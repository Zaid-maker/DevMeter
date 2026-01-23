import { Metadata } from "next";

export const metadata: Metadata = {
  title: "DevMeter Blog - Developer Productivity & Analytics Insights",
  description: "Insights on coding productivity, developer analytics, time tracking tips, and best practices. Learn how to boost your development workflow with data-driven strategies.",
  keywords: ["developer blog", "coding productivity", "time tracking", "developer tips", "VS Code extensions", "developer habits", "productivity tips", "code metrics", "development workflow"],
  authors: [{ name: "DevMeter Team" }],
  alternates: {
    canonical: "https://devmeter-v2.zaidcode.me/blog",
  },
  openGraph: {
    title: "DevMeter Blog - Developer Productivity & Analytics",
    description: "Read our latest insights on coding productivity, developer analytics, and best practices for developers.",
    type: "website",
    url: "https://devmeter-v2.zaidcode.me/blog",
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
    title: "DevMeter Blog",
    description: "Coding productivity and developer analytics insights.",
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
  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "DevMeter Blog",
    description: "Insights on coding productivity and developer analytics",
    url: "https://devmeter-v2.zaidcode.me/blog",
    publisher: {
      "@type": "Organization",
      name: "DevMeter",
      url: "https://devmeter-v2.zaidcode.me",
    },
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
        name: "Blog",
        item: "https://devmeter-v2.zaidcode.me/blog",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
