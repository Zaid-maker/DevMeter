"use client";

import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, Calendar, ArrowLeft, Share2 } from "lucide-react";
import Link from "next/link";

interface BlogArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  author: string;
  date: string;
  readTime: number;
  category: string;
  image?: string;
}

const blogArticles: Record<string, BlogArticle> = {
  "how-to-improve-coding-productivity": {
    id: "how-to-improve-coding-productivity",
    title: "How to Improve Your Coding Productivity in 2026",
    description: "Discover proven strategies to boost your development speed and maintain focus while coding.",
    author: "Sarah Chen",
    date: "2026-01-20",
    readTime: 8,
    category: "Productivity",
    content: `
# How to Improve Your Coding Productivity in 2025

Productivity is not about working longer hours—it's about working smarter. As developers, we often struggle with distractions, context switching, and losing track of time while coding. Here are proven strategies to boost your productivity.

## 1. Track Your Time Accurately

Understanding where your time goes is the first step to improving productivity. Tools like DevMeter automatically track your coding activity, showing you:

- Which projects consume the most time
- Your peak productivity hours
- Time spent on different languages and files
- Patterns in your work habits

With this data, you can identify bottlenecks and optimize your workflow.

## 2. Eliminate Context Switching

Context switching is one of the biggest productivity killers. Each time you switch between tasks, it takes 15-20 minutes to regain focus. Instead:

- Block time for specific projects
- Use "focus hours" where you disable notifications
- Batch similar tasks together
- Use VS Code extensions to stay in your editor

## 3. Optimize Your Environment

Your physical and digital environment matters:

- Use a quiet workspace
- Keep your IDE clean and organized
- Use keyboard shortcuts instead of mouse clicks
- Remove browser distractions
- Keep only necessary tabs open

## 4. Take Strategic Breaks

Counter-intuitive, but breaks improve productivity. The Pomodoro Technique (25 min work, 5 min break) is highly effective. Regular breaks help you:

- Maintain focus and energy
- Reduce mental fatigue
- Generate better solutions
- Avoid burnout

## 5. Set Clear Goals

Know what you're working on before you start coding:

- Break large tasks into smaller stories
- Define "done" criteria
- Use task tracking tools
- Review progress daily

## 6. Use the Right Tools

Leverage tools that automate routine tasks:

- VS Code extensions for linting, formatting
- Automated testing frameworks
- CI/CD pipelines
- Time tracking tools (like DevMeter!)

## Conclusion

Productivity improvement is a journey, not a destination. Start with one strategy, measure the results with a tool like DevMeter, and iterate. Your future self will thank you.

---

**What productivity strategy works best for you? Let us know in the comments below!**
    `,
  },
  "understanding-developer-metrics": {
    id: "understanding-developer-metrics",
    title: "Understanding Developer Metrics: What Actually Matters",
    description: "Not all metrics are created equal. We break down which development metrics actually impact your productivity.",
    author: "Alex Kumar",
    date: "2026-01-18",
    readTime: 6,
    category: "Analytics",
    content: `
# Understanding Developer Metrics: What Actually Matters

In the age of data, developers are drowning in metrics. But which ones actually matter? Let's break down the metrics that will genuinely improve your development process.

## Good Metrics vs Vanity Metrics

### Bad Metrics (Vanity Metrics)
- Lines of code written (incentivizes bloat)
- Hours worked (doesn't measure output)
- Number of commits (encourages micro-commits)

### Good Metrics (Actionable)
- Code quality (bugs per release)
- Time to productivity (context switching efficiency)
- Feature delivery cycle time
- Actual coding time vs meetings

## The Metrics That Matter

### 1. Focus Time
How much uninterrupted time do you have for actual coding? DevMeter tracks this automatically, showing when you're in deep work vs. context switching.

### 2. Project Distribution
Understanding how your time is distributed across projects helps with:
- Capacity planning
- Identifying bottlenecks
- Workload balancing

### 3. Language Proficiency
Which languages do you spend the most time with? This helps with:
- Skill development planning
- Team allocation decisions
- Career growth tracking

### 4. Peak Productivity Hours
When are you most productive? Most developers have specific hours where they:
- Write better code
- Solve problems faster
- Experience fewer bugs

### 5. Burnout Indicators
Metrics can warn you before burnout:
- Decreasing focus time
- Increasing meetings
- Consistent overtime
- Declining code quality

## Using Metrics Responsibly

Remember: Metrics should guide, not punish. Use them to:
- Optimize your workflow
- Identify areas for improvement
- Celebrate progress
- Make data-driven decisions

## Conclusion

The best metric is one that helps you become a better developer. Focus on metrics that inform your decisions and improve your work quality.

---

**What metrics do you track? Share your experience in our community!**
    `,
  },
  "best-vs-code-extensions-developers": {
    id: "best-vs-code-extensions-developers",
    title: "10 Essential VS Code Extensions Every Developer Should Use",
    description: "From time tracking to code formatting, we've compiled the best VS Code extensions that will transform your workflow.",
    author: "Emma Johnson",
    date: "2026-01-15",
    readTime: 10,
    category: "Tools",
    content: `
# 10 Essential VS Code Extensions Every Developer Should Use

VS Code's power comes from its extensions. Here are the must-have extensions that will boost your productivity and code quality.

## Productivity Extensions

### 1. DevMeter
Track your coding time automatically. Understand your productivity patterns, identify peak hours, and measure focus time. [Learn more](https://devmeter-v2.zaidcode.me)

### 2. Thunder Client
Built-in REST client for API testing without leaving VS Code. Better than Postman for quick testing.

### 3. Code Time
Automatic time tracking and coding analytics. Great for understanding your development habits.

## Code Quality Extensions

### 4. ESLint
Real-time JavaScript linting. Catch errors before they become bugs.

### 5. Prettier
Automatic code formatting. Stop bikeshedding about code style.

### 6. SonarLint
Detect bugs and vulnerabilities as you code.

## Development Experience

### 7. GitLens
Master Git inside VS Code. See line history, blame information, and repository insights.

### 8. REST Client
Send HTTP requests directly from VS Code. No more switching between editors.

### 9. Thunder Client or Insomnia
API testing without leaving your editor.

### 10. Peacock
Customize VS Code colors for different workspaces. Helpful when juggling multiple projects.

## Bonus Extensions

- **Live Share** - Collaborate with teammates in real-time
- **Docker** - Manage containers from VS Code
- **Remote SSH** - Develop on remote servers
- **GitHub Copilot** - AI code completion

## Pro Tips

1. Install extensions that solve your specific pain points
2. Too many extensions can slow VS Code down
3. Regularly review and remove unused extensions
4. Keep extensions updated

## Conclusion

These extensions will transform your VS Code experience. Start with the ones that solve your biggest challenges, then expand from there.

---

**What's your favorite VS Code extension? Share in the comments!**
    `,
  },
};

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const post = blogArticles[slug];

  if (!post) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <Button variant="ghost" onClick={() => router.back()} className="mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Button>
          <Card>
            <CardContent className="pt-12 text-center">
              <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
              <p className="text-muted-foreground mb-6">
                This article doesn't exist or has been removed.
              </p>
              <Link href="/blog">
                <Button>Go to Blog</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Blog
        </Button>

        {/* Article Header */}
        <article className="space-y-6">
          <div className="space-y-3">
            <Badge className="bg-primary text-black w-fit">{post.category}</Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{post.title}</h1>
            <p className="text-xl text-muted-foreground">{post.description}</p>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-y border-white/5 py-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                {new Date(post.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{post.readTime} min read</span>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-invert max-w-none">
            <div className="space-y-4">
              {post.content.split("\n").map((paragraph, idx) => {
                if (paragraph.startsWith("# ")) {
                  return (
                    <h1 key={idx} className="text-3xl font-bold mt-8 mb-4">
                      {paragraph.replace("# ", "")}
                    </h1>
                  );
                }
                if (paragraph.startsWith("## ")) {
                  return (
                    <h2 key={idx} className="text-2xl font-bold mt-6 mb-3">
                      {paragraph.replace("## ", "")}
                    </h2>
                  );
                }
                if (paragraph.startsWith("### ")) {
                  return (
                    <h3 key={idx} className="text-xl font-semibold mt-4 mb-2">
                      {paragraph.replace("### ", "")}
                    </h3>
                  );
                }
                if (paragraph.startsWith("- ")) {
                  return (
                    <li key={idx} className="ml-6 text-muted-foreground">
                      {paragraph.replace("- ", "")}
                    </li>
                  );
                }
                if (paragraph.trim() === "") return null;
                return (
                  <p key={idx} className="text-muted-foreground leading-relaxed">
                    {paragraph}
                  </p>
                );
              })}
            </div>
          </div>

          {/* Share */}
          <div className="pt-6 border-t border-white/5">
            <Button variant="outline" className="gap-2">
              <Share2 className="h-4 w-4" />
              Share Article
            </Button>
          </div>
        </article>

        {/* Related Posts */}
        <Card className="mt-12">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">More Articles</h3>
            <div className="space-y-2">
              {Object.values(blogArticles)
                .filter((p) => p.id !== post.id)
                .slice(0, 3)
                .map((relatedPost) => (
                  <Link
                    key={relatedPost.id}
                    href={`/blog/${relatedPost.id}`}
                    className="block p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <p className="font-medium hover:text-primary transition-colors">
                      {relatedPost.title}
                    </p>
                    <p className="text-sm text-muted-foreground">{relatedPost.category}</p>
                  </Link>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
