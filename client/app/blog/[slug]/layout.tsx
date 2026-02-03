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
  "why-wakatime-alternative-devmeter": {
    title: "Why We Built DevMeter: A Free Alternative to WakaTime",
    description: "The story behind DevMeter. Why we believed developers deserve a free, open-source time tracker without paywalls or limited features.",
    category: "News",
    date: "2026-02-04",
    author: "Zaid Code",
    readTime: 7,
  },
  "understanding-developer-metrics": {
    title: "Understanding Developer Metrics: What Actually Matters",
    description: "Not all metrics are created equal. We break down which development metrics actually impact your productivity and how to use them effectively.",
    category: "Analytics",
    date: "2026-01-18",
    author: "Alex Kumar",
    readTime: 6,
  },
  "productivity-metrics-lines-of-code-meaningless": {
    title: "Productivity Metrics That Matter: Why Lines of Code is Meaningless",
    description: "Stop measuring code quantity. Learn which metrics actually indicate developer productivity and how to interpret them correctly.",
    category: "Analytics",
    date: "2026-02-03",
    author: "Dr. Michael Thompson",
    readTime: 9,
  },
  "developer-burnout-early-detection": {
    title: "Developer Burnout: How to Detect It Early with Time Tracking",
    description: "Burnout is real. Discover the warning signs hidden in your coding patterns and how time tracking can help you recover before it's too late.",
    category: "Mental Health",
    date: "2026-02-02",
    author: "Jessica Moore",
    readTime: 11,
  },
  "best-vs-code-extensions-developers": {
    title: "10 Essential VS Code Extensions Every Developer Should Use",
    description: "From time tracking to code formatting, we've compiled the best VS Code extensions that will transform your development workflow.",
    category: "Tools",
    date: "2026-01-15",
    author: "Emma Johnson",
    readTime: 10,
  },
  "building-coding-habits-data-driven": {
    title: "Building Better Coding Habits: A Data-Driven Approach",
    description: "Use your own data to understand and improve your coding habits. Real strategies based on actual developer patterns.",
    category: "Habits",
    date: "2026-02-01",
    author: "David Park",
    readTime: 10,
  },
  "remote-work-productivity-guide": {
    title: "Remote Work Productivity: A Complete Guide for Developers",
    description: "Working from home presents unique challenges. Learn how to stay productive, track your time effectively, and maintain work-life balance.",
    category: "Remote Work",
    date: "2026-01-12",
    author: "Marcus Williams",
    readTime: 12,
  },
  "time-tracking-accuracy": {
    title: "The Importance of Accurate Time Tracking for Developers",
    description: "Why tracking your coding time matters more than you think. Understand your patterns, improve focus, and make better decisions.",
    category: "Productivity",
    date: "2026-01-10",
    author: "Lisa Zhang",
    readTime: 7,
  },
  "devmeter-setup-guide": {
    title: "Complete DevMeter Setup Guide: From Installation to Mastery",
    description: "Get the most out of DevMeter with our comprehensive setup and configuration guide. Optimize tracking and unlock all features.",
    category: "Tutorial",
    date: "2026-01-08",
    author: "James Patterson",
    readTime: 9,
  },
  "open-source-vs-paid-tools": {
    title: "Open Source vs Paid Developer Tools: Why You Should Care",
    description: "The hidden costs of paid tools. Explore why open-source alternatives like DevMeter offer better value and more control.",
    category: "Tools",
    date: "2026-01-31",
    author: "Rachel Green",
    readTime: 8,
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
