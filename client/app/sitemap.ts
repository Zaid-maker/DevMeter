import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://devmeter-v2.zaidcode.me";

  // Blog posts
  const blogPosts = [
    "how-to-improve-coding-productivity",
    "why-wakatime-alternative-devmeter",
    "understanding-developer-metrics",
    "productivity-metrics-lines-of-code-meaningless",
    "developer-burnout-early-detection",
    "best-vs-code-extensions-developers",
    "building-coding-habits-data-driven",
    "remote-work-productivity-guide",
    "time-tracking-accuracy",
    "devmeter-setup-guide",
    "open-source-vs-paid-tools",
  ];

  const blogRoutes = blogPosts.map((slug) => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const routes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/docs`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/leaderboard`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    ...blogRoutes,
  ];

  return routes;
}
