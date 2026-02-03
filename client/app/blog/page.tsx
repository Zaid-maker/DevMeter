"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, User, ArrowRight } from "lucide-react";
import Link from "next/link";

interface BlogPost {
  id: string;
  title: string;
  description: string;
  author: string;
  date: string;
  readTime: number;
  category: string;
  image?: string;
  featured?: boolean;
}

const blogPosts: BlogPost[] = [
  {
    id: "how-to-improve-coding-productivity",
    title: "How to Improve Your Coding Productivity in 2026",
    description: "Discover proven strategies to boost your development speed and maintain focus while coding. Learn about time tracking, breaks, and productivity techniques used by top developers.",
    author: "Sarah Chen",
    date: "2026-01-20",
    readTime: 8,
    category: "Productivity",
    featured: true,
  },
  {
    id: "why-wakatime-alternative-devmeter",
    title: "Why We Built DevMeter: A Free Alternative to WakaTime",
    description: "The story behind DevMeter. Why we believed developers deserve a free, open-source time tracker without paywalls or limited features.",
    author: "Zaid Code",
    date: "2026-02-04",
    readTime: 7,
    category: "News",
    featured: true,
  },
  {
    id: "understanding-developer-metrics",
    title: "Understanding Developer Metrics: What Actually Matters",
    description: "Not all metrics are created equal. We break down which development metrics actually impact your productivity and how to use them effectively.",
    author: "Alex Kumar",
    date: "2026-01-18",
    readTime: 6,
    category: "Analytics",
    featured: true,
  },
  {
    id: "productivity-metrics-lines-of-code-meaningless",
    title: "Productivity Metrics That Matter: Why Lines of Code is Meaningless",
    description: "Stop measuring code quantity. Learn which metrics actually indicate developer productivity and how to interpret them correctly.",
    author: "Dr. Michael Thompson",
    date: "2026-02-03",
    readTime: 9,
    category: "Analytics",
  },
  {
    id: "developer-burnout-early-detection",
    title: "Developer Burnout: How to Detect It Early with Time Tracking",
    description: "Burnout is real. Discover the warning signs hidden in your coding patterns and how time tracking can help you recover before it's too late.",
    author: "Jessica Moore",
    date: "2026-02-02",
    readTime: 11,
    category: "Mental Health",
  },
  {
    id: "best-vs-code-extensions-developers",
    title: "10 Essential VS Code Extensions Every Developer Should Use",
    description: "From time tracking to code formatting, we've compiled the best VS Code extensions that will transform your development workflow.",
    author: "Emma Johnson",
    date: "2026-01-15",
    readTime: 10,
    category: "Tools",
  },
  {
    id: "building-coding-habits-data-driven",
    title: "Building Better Coding Habits: A Data-Driven Approach",
    description: "Use your own data to understand and improve your coding habits. Real strategies based on actual developer patterns.",
    author: "David Park",
    date: "2026-02-01",
    readTime: 10,
    category: "Habits",
  },
  {
    id: "remote-work-productivity-guide",
    title: "Remote Work Productivity: A Complete Guide for Developers",
    description: "Working from home presents unique challenges. Learn how to stay productive, track your time effectively, and maintain work-life balance.",
    author: "Marcus Williams",
    date: "2026-01-12",
    readTime: 12,
    category: "Remote Work",
  },
  {
    id: "time-tracking-accuracy",
    title: "The Importance of Accurate Time Tracking for Developers",
    description: "Why tracking your coding time matters more than you think. Understand your patterns, improve focus, and make better decisions.",
    author: "Lisa Zhang",
    date: "2026-01-10",
    readTime: 7,
    category: "Productivity",
  },
  {
    id: "devmeter-setup-guide",
    title: "Complete DevMeter Setup Guide: From Installation to Mastery",
    description: "Get the most out of DevMeter with our comprehensive setup and configuration guide. Optimize tracking and unlock all features.",
    author: "James Patterson",
    date: "2026-01-08",
    readTime: 9,
    category: "Tutorial",
  },
  {
    id: "open-source-vs-paid-tools",
    title: "Open Source vs Paid Developer Tools: Why You Should Care",
    description: "The hidden costs of paid tools. Explore why open-source alternatives like DevMeter offer better value and more control.",
    author: "Rachel Green",
    date: "2026-01-31",
    readTime: 8,
    category: "Tools",
  },
];

export default function BlogPage() {
  const featuredPosts = blogPosts.filter((post) => post.featured);
  const regularPosts = blogPosts.filter((post) => !post.featured);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg">
              <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-black" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">DevMeter Blog</h1>
              <p className="text-sm md:text-base text-muted-foreground mt-2">
                Insights on coding productivity, developer analytics, and best practices
              </p>
            </div>
          </div>
        </div>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Featured</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {featuredPosts.map((post) => (
                <Link key={post.id} href={`/blog/${post.id}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="default" className="bg-primary text-black">
                          {post.category}
                        </Badge>
                      </div>
                      <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                      <CardDescription className="line-clamp-2">{post.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground line-clamp-2">{post.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{post.author}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{post.readTime} min read</span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(post.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                      <div className="flex items-center gap-2 text-primary text-sm font-medium pt-2">
                        Read Article
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* All Posts */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Latest Articles</h2>
          <div className="space-y-4">
            {regularPosts.map((post) => (
              <Link key={post.id} href={`/blog/${post.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline">{post.category}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(post.date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <h3 className="text-xl font-semibold hover:text-primary transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-muted-foreground line-clamp-2">{post.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{post.author}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{post.readTime} min</span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
