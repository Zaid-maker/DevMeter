import { Metadata } from "next";
import { use } from "react";

const blogArticles: Record<string, { title: string; description: string; category: string; date: string; author: string; readTime: number }> = {
  "how-to-improve-coding-productivity": {
    title: "How to Improve Your Coding Productivity in 2026",
    description: "Discover proven strategies to boost your development speed and maintain focus while coding. Learn about time tracking, breaks, and productivity techniques used by top developers.",
    category: "Productivity",
    date: "2026-01-20",
    author: "Sarah Chen",
    readTime: 8,
  },
  "understanding-developer-metrics": {
    title: "Understanding Developer Metrics: What Actually Matters",
    description: "Not all metrics are created equal. We break down which development metrics actually impact your productivity and how to use them effectively.",
    category: "Analytics",
    date: "2026-01-18",
    author: "Alex Kumar",
    readTime: 6,
  },
  "best-vs-code-extensions-developers": {
    title: "10 Essential VS Code Extensions Every Developer Should Use",
    description: "From time tracking to code formatting, we've compiled the best VS Code extensions that will transform your development workflow.",
    category: "Tools",
    date: "2026-01-15",
    author: "Emma Johnson",
    readTime: 10,
  },
};

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> => {
  const { slug } = await params;
  const post = blogArticles[slug];

  if (!post) {
    return {
      title: "Article Not Found - DevMeter Blog",
    };
  }

  return {
    title: `${post.title} | DevMeter Blog`,
    description: post.description,
    keywords: [post.category.toLowerCase(), "DevMeter", "developer productivity", "coding", "tips"],
    authors: [{ name: post.author }],
    alternates: {
      canonical: `https://devmeter-v2.zaidcode.me/blog/${slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url: `https://devmeter-v2.zaidcode.me/blog/${slug}`,
      publishedTime: post.date,
      authors: [post.author],
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
      title: post.title,
      description: post.description,
      creator: `@devmeter`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
};

export default function BlogPostLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const post = blogArticles[slug];

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post?.title || "Blog Post",
    description: post?.description || "",
    image: "https://devmeter-v2.zaidcode.me/og-image.png",
    datePublished: post?.date || new Date().toISOString(),
    author: {
      "@type": "Person",
      name: post?.author || "DevMeter Team",
    },
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
      {
        "@type": "ListItem",
        position: 3,
        name: post?.title || "Article",
        item: `https://devmeter-v2.zaidcode.me/blog/${slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
