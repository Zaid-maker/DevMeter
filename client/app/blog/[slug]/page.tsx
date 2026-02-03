"use client";

import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, Calendar, ArrowLeft, Share2, List } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

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
  "why-wakatime-alternative-devmeter": {
    id: "why-wakatime-alternative-devmeter",
    title: "Why We Built DevMeter: A Free Alternative to WakaTime",
    description: "The story behind DevMeter. Why we believed developers deserve a free, open-source time tracker.",
    author: "Zaid Code",
    date: "2026-02-04",
    readTime: 7,
    category: "News",
    content: `
# Why We Built DevMeter: A Free Alternative to WakaTime

We love WakaTime. It's a great product. But we realized something: **developers shouldn't have to pay for insights into their own coding.**

## The Problem with Existing Solutions

### 1. Paywalls Over Functionality
WakaTime charges $9-20/month for features many developers use daily. For a freelancer or student, that's $108-240/year just to track their time.

### 2. Limited Free Features
The free tier is severely restricted:
- Only 2 weeks of data history
- Limited insights
- No team collaboration
- No custom integrations

### 3. Vendor Lock-in
Your data belongs to them. Want to leave? Good luck exporting meaningful data.

### 4. Privacy Concerns
Your code activity is stored on their servers. For some developers, that's a dealbreaker.

## Why DevMeter is Different

### ✅ 100% Free
Forever. No premium tiers. No upsells. Open source means you can audit the code yourself.

### ✅ Local First
Your data stays on your machine by default. Sync is optional.

### ✅ Open Source
MIT Licensed. Fork it, modify it, contribute back. It's yours.

### ✅ No Ads
No tracking, no sponsored recommendations, no corporate nonsense.

### ✅ Developer-Made
Built by developers, for developers. We use it ourselves.

## The DevMeter Philosophy

We believe:
1. **Your data is yours** - Not a product to monetize
2. **Good tools shouldn't be expensive** - Open source wins
3. **Developers deserve better** - Time tracking should be effortless
4. **Privacy matters** - Your code stays private

## What's Next?

We're just getting started. Upcoming features:
- Team collaboration (free)
- Custom insights
- Advanced analytics
- Mobile app (free)

All free. Always.

## Join Us

If you're tired of WakaTime's paywalls and restrictions, give DevMeter a try. It's truly free, truly yours.

[Install DevMeter Now](https://devmeter-v2.zaidcode.me)

---

**Have suggestions? Join our community on [GitHub](https://github.com/devmeter/devmeter)**
    `,
  },
  "productivity-metrics-lines-of-code-meaningless": {
    id: "productivity-metrics-lines-of-code-meaningless",
    title: "Productivity Metrics That Matter: Why Lines of Code is Meaningless",
    description: "Stop measuring code quantity. Learn which metrics actually indicate developer productivity.",
    author: "Dr. Michael Thompson",
    date: "2026-02-03",
    readTime: 9,
    category: "Analytics",
    content: `
# Productivity Metrics That Matter: Why Lines of Code is Meaningless

Here's a hard truth: **Lines of Code (LOC) is one of the worst productivity metrics you can track.**

Yet many organizations still use it. Let's fix that.

## Why Lines of Code Fails

### Problem 1: It Rewards Bloat
Bad code can be verbose. Good code can be concise. Measuring LOC incentivizes developers to write more code, not better code.

### Problem 2: Ignores Refactoring
Refactoring often *reduces* LOC while improving quality. By LOC metrics, this looks like decreased productivity.

### Problem 3: Language Agnostic
100 lines of Python might equal 300 lines of Java. How do you compare across languages?

### Problem 4: Doesn't Measure Output
A developer writing 100 lines of bug-free, well-tested code is more productive than one writing 500 lines of spaghetti.

## What Actually Matters

### ✅ 1. Focus Time
How much uninterrupted time do you have for deep work?

Metric: Minutes/hours of focused coding without context switches

### ✅ 2. Feature Delivery
How many features shipped? How fast?

Metric: Features completed per sprint, time-to-production

### ✅ 3. Code Quality
Is your code maintainable and bug-free?

Metrics: Test coverage, bug density, code review comments

### ✅ 4. Consistency
Are you maintaining a steady pace?

Metric: Weekly/monthly coding time trends

### ✅ 5. Learning & Growth
Are you expanding your skills?

Metric: New languages/frameworks used, contributions to learning projects

## How DevMeter Helps

DevMeter tracks the metrics that matter:
- **Focus Time** - See when you're in flow
- **Project Balance** - Understand time distribution
- **Language Proficiency** - Track language usage over time
- **Burnout Indicators** - Spot unhealthy patterns early
- **Consistency** - Maintain sustainable pace

## The Real Question

Instead of "How much code did you write?" ask:

"Did you ship value? Did you maintain quality? Did you stay healthy?"

These are the questions that matter.

## Conclusion

Metrics should empower, not punish. Choose metrics that reveal truth, not metrics that game the system.

Track what matters. DevMeter helps you do that.

---

**What metrics do you find most valuable? Share your thoughts!**
    `,
  },
  "developer-burnout-early-detection": {
    id: "developer-burnout-early-detection",
    title: "Developer Burnout: How to Detect It Early with Time Tracking",
    description: "Burnout is real. Discover the warning signs hidden in your coding patterns.",
    author: "Jessica Moore",
    date: "2026-02-02",
    readTime: 11,
    category: "Mental Health",
    content: `
# Developer Burnout: How to Detect It Early with Time Tracking

Burnout crept up on me slowly. By the time I realized it, I was exhausted, frustrated, and seriously considering leaving tech entirely.

I wish I'd had the data to see it coming.

## The Burnout Pattern

Burnout isn't sudden. It's a slow decay. And your time tracking data can show you the warning signs **weeks before** you feel them.

### Warning Sign 1: Declining Focus Time
**What to look for:** Increasing context switching, shorter focus blocks

Burnout makes it harder to concentrate. You'll notice:
- Longer to complete same tasks
- More frequent breaks (beyond normal)
- Difficulty starting new features

### Warning Sign 2: Unsustainable Hours
**What to look for:** Consistent 50+ hour weeks for 4+ weeks

You might think you're productive. You're actually burning out.

Research shows: Past 55 hours/week, productivity *drops*. You're working harder but accomplishing less.

### Warning Sign 3: Lack of Variety
**What to look for:** Same project for 90%+ of time

Burnout thrives in monotony. Variety keeps you engaged. If you're stuck on one thing for months without relief, it's a red flag.

### Warning Sign 4: No Peak Hours
**What to look for:** Flattened energy (coding evenly throughout day)

Healthy developers have peak hours. If your coding is evenly distributed, you might be:
- Forcing productivity artificially
- Lost your natural rhythm
- Overworking past healthy limits

### Warning Sign 5: Weekend Coding
**What to look for:** Regular weekend commits

Some weekend work is fine. Regular weekend coding? That's a burnout signal.

You need rest. Your brain needs recovery time.

## The Recovery Pattern

When I tracked my recovery, I noticed:

**Week 1-2:** Focus time returns to normal
**Week 3-4:** Context switching decreases  
**Week 5-6:** Energy (coding time) becomes sustainable
**Week 7+:** Happiness returns

Time tracking made this visible. I could *prove* I was recovering.

## How DevMeter Helps

DevMeter shows you:
- Daily coding hours (spot overtime patterns)
- Weekly trends (see if you're overworking)
- Focus time metrics (context switching detection)
- Project distribution (monotony detection)
- Historical data (long-term patterns)

## What To Do If You're Burning Out

1. **Track it** - Start measuring your patterns
2. **Accept it** - Burnout is real, not weakness
3. **Communicate** - Tell your manager/team
4. **Reduce hours** - Take actual time off
5. **Variety** - Switch projects/focus areas
6. **Check-in** - Monitor your recovery with data

## The Real Talk

If you're in tech long-term, you will face burnout. The difference between people who recover and people who leave is:

**Early detection.**

Your time tracking data is your canary in the coal mine. Pay attention to it.

---

**If you're burning out: You're not alone. It's okay to take time off.**

---

**What helped you recover from burnout? Share in the comments below.**
    `,
  },
  "building-coding-habits-data-driven": {
    id: "building-coding-habits-data-driven",
    title: "Building Better Coding Habits: A Data-Driven Approach",
    description: "Use your own data to understand and improve your coding habits.",
    author: "David Park",
    date: "2026-02-01",
    readTime: 10,
    category: "Habits",
    content: `
# Building Better Coding Habits: A Data-Driven Approach

You know you *should* code daily. But knowing and doing are different.

The secret? Use your own data to build habits that stick.

## The Habit Loop

Charles Duhigg's research shows habits follow a loop:

1. **Cue** - Something triggers the behavior
2. **Routine** - The behavior itself
3. **Reward** - The satisfaction/dopamine hit

To build coding habits, we need to optimize all three.

## Step 1: Establish Your Baseline

Before changing anything, measure:
- How many hours do you actually code per week?
- What time of day are you most productive?
- How long before you need a break?
- What environment works best?

Use DevMeter to track this for 2 weeks. Don't change anything yet. Just observe.

## Step 2: Set a Specific Cue

"Code more often" won't work. Specificity does.

Better cues:
- **Time-based**: "Every morning at 9am, I code for 90 minutes"
- **Event-based**: "After I finish breakfast, I start coding"
- **Environmental**: "When my standing desk is in standing position, I code"

Example: *"After my morning coffee, before checking email, I code for 90 minutes"*

## Step 3: Optimize Your Routine

Routine = the actual habit

Good coding routines have:
- **Clear start/end** - "9am to 10:30am" not "whenever"
- **Single focus** - One project/task, no switching
- **No distractions** - Phone in another room, notifications off
- **Sustainable length** - 60-90 minutes is ideal for most people

Research shows: It takes ~66 days to form a habit. Expect 2 months.

## Step 4: Engineer the Reward

Dopamine drives habit formation. You need immediate rewards.

Good rewards:
- Checking off a completed task
- Streak counter (like "7 days in a row!")
- Public accountability (post your streak)
- Small treat after the session

Bad rewards:
- "I'll reward myself after 3 months"
- Vague achievements
- No immediate feedback

## Step 5: Track and Adjust

This is where DevMeter shines.

Every week, review:
- Did I hit my target hours?
- When did I code (peak times)?
- What broke my streak?
- How much focus time did I have?

If you miss a day, that's normal. The key: Get back on track the next day.

## The Data-Driven Advantage

When you track, you see:
- **Patterns** - "I code best Tuesdays-Thursdays"
- **Obstacles** - "Meetings destroy my focus on Mondays"
- **Progress** - "I'm up to 20 hours/week from 8"
- **Success** - "60-day streak!"

Data makes it real. You can't argue with numbers.

## 30-Day Habit Challenge

Try this:

**Days 1-7:**
- Establish cue: Pick specific time
- Track baseline hours
- No pressure, just observe

**Days 8-14:**
- Start your routine
- Track daily
- Notice when it's hardest

**Days 15-21:**
- Routine feels easier
- Celebrate small wins
- Adjust if needed

**Days 22-30:**
- Habit is sticking
- Habit is becoming automatic
- Plan next level

## Tools to Help

- **DevMeter**: Track your coding time and patterns
- **Streaks app**: Visual streak counter
- **Calendar**: Big red X for each day you code
- **Accountability buddy**: Text a friend daily

## Conclusion

Coding habits aren't built through willpower. They're built through:

1. Specific cues
2. Optimized routines
3. Immediate rewards
4. Consistent tracking
5. Data-driven adjustments

Start measuring. You can't improve what you don't measure.

---

**What's your current coding habit? Start tracking and share your 30-day progress!**
    `,
  },
  "open-source-vs-paid-tools": {
    id: "open-source-vs-paid-tools",
    title: "Open Source vs Paid Developer Tools: Why You Should Care",
    description: "The hidden costs of paid tools. Explore why open-source alternatives offer better value.",
    author: "Rachel Green",
    date: "2026-01-31",
    readTime: 8,
    category: "Tools",
    content: `
# Open Source vs Paid Developer Tools: Why You Should Care

Every month, developers pay subscriptions to tools they barely understand. 

What if I told you there's usually a better alternative?

## The Hidden Cost of Paid Tools

When evaluating a $10/month tool, most developers think:
- $10/month = $120/year = not a big deal

But there are hidden costs:

### Cost 1: Feature Lock-in
Paid tools often lock features behind paywalls. Need advanced features? Upgrade to the $20 plan. Want more? $30 plan.

Total cost: Can exceed $300-500/year for a single tool.

### Cost 2: Data Extraction
Want to leave? Good luck getting your data.

Some tools make it intentionally hard. You're trapped.

### Cost 3: Feature Changes
Paid tools change features and pricing without notice. Remember when they removed your favorite feature?

Open source can't do this. The community can fork if needed.

### Cost 4: Dependency Risk
What if the company goes under? Shuts down the service?

Paid tools are at risk. Open source survives.

## Why Open Source Wins

### Advantage 1: Transparency
You can read the code. See exactly what it does.

No hidden data collection. No surprise features.

### Advantage 2: Customization
Want to modify it? You can. Fork it. Change it. Make it yours.

Paid tools? You're stuck with what they give you.

### Advantage 3: Sustainability
Open source projects are more resilient. If one maintainer leaves, others can continue.

Paid products? One bad quarter and they're dead.

### Advantage 4: Community
Open source builds communities. Paid tools build customer lists.

Communities are more helpful, more invested, more loyal.

### Advantage 5: True Ownership
With open source, your data is yours. Your tool is yours.

With paid tools, you're just renting.

## Real Example: WakaTime vs DevMeter

| Aspect | WakaTime | DevMeter |
|--------|----------|----------|
| **Cost** | $9-20/month | Free |
| **Data** | Theirs | Yours |
| **Open Source** | No | Yes |
| **Customizable** | No | Yes |
| **Risk** | Company dependent | Community sustained |

DevMeter offers everything WakaTime does, free, open source.

Why would you choose WakaTime?

You wouldn't. That's the point.

## When Paid Tools Make Sense

Open source isn't always right:
- When you need professional support (some open source offers this)
- When you need guaranteed uptime (some open source has SLAs)
- When commercial viability matters

But for *most* developers, open source is better.

## The Open Source Developer Community

When you use open source, you're not just getting free software.

You're joining a community of:
- People who care about the tool
- Contributors improving it
- Builders learning from others

That's worth more than any paid feature.

## Switching to Open Source

Ready to break free from paid tools?

Start with:
- **Time tracking**: DevMeter (instead of WakaTime)
- **Code editor**: VS Code (instead of paid IDEs)
- **Testing**: Jest, Pytest (instead of paid tools)
- **Monitoring**: Prometheus, Grafana (instead of DataDog, New Relic)
- **Communication**: Zulip, Mattermost (instead of Slack)

One tool at a time. You'll save thousands.

## Conclusion

The best tool isn't always the most expensive one.

Often, it's the one the community built and shares freely.

Give open source a try. You might be surprised at the quality.

---

**What paid tools could you replace with open source? Share your ideas!**
    `,
  },

};

interface Heading {
  id: string;
  text: string;
  level: number;
}

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const post = blogArticles[slug];
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeHeading, setActiveHeading] = useState("");

  useEffect(() => {
    if (!post) return;

    // Extract headings from content
    const headingRegex = /^(#{1,3})\s(.+)$/gm;
    const extractedHeadings: Heading[] = [];
    let match;

    while ((match = headingRegex.exec(post.content)) !== null) {
      const level = match[1].length;
      const text = match[2];
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      extractedHeadings.push({ id, text, level });
    }

    setHeadings(extractedHeadings);
  }, [post]);

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
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <article className="lg:col-span-3 space-y-8">
          {/* Back Button */}
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Button>
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
                  const text = paragraph.replace("# ", "");
                  const id = text
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, "");
                  return (
                    <h1 key={idx} id={id} className="text-3xl font-bold mt-8 mb-4 scroll-mt-20">
                      {text}
                    </h1>
                  );
                }
                if (paragraph.startsWith("## ")) {
                  const text = paragraph.replace("## ", "");
                  const id = text
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, "");
                  return (
                    <h2 key={idx} id={id} className="text-2xl font-bold mt-6 mb-3 scroll-mt-20">
                      {text}
                    </h2>
                  );
                }
                if (paragraph.startsWith("### ")) {
                  const text = paragraph.replace("### ", "");
                  const id = text
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, "");
                  return (
                    <h3 key={idx} id={id} className="text-xl font-semibold mt-4 mb-2 scroll-mt-20">
                      {text}
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
        </article>

        {/* Sidebar - Table of Contents */}
        {headings.length > 0 && (
          <aside className="lg:col-span-1 hidden lg:block">
            <div className="sticky top-8 space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <List className="h-4 w-4" />
                    <h3 className="font-semibold">Table of Contents</h3>
                  </div>
                  <nav className="space-y-2 text-sm">
                    {headings.map((heading) => (
                      <Link
                        key={heading.id}
                        href={`#${heading.id}`}
                        className={`block hover:text-primary transition-colors $
                          {heading.level === 2 ? "font-medium" : "text-muted-foreground"}
                        `}
                        style={{ paddingLeft: `${(heading.level - 2) * 16}px` }}
                        onClick={() => setActiveHeading(heading.id)}
                      >
                        {heading.text}
                      </Link>
                    ))}
                  </nav>
                </CardContent>
              </Card>

              {/* Quick Links */}
              <Card>
                <CardContent className="pt-6">
                  <h4 className="font-semibold mb-3 text-sm">Quick Links</h4>
                  <div className="space-y-2">
                    <Link
                      href="/docs"
                      className="block text-sm hover:text-primary transition-colors text-muted-foreground"
                    >
                      → View Docs
                    </Link>
                    <Link
                      href="/blog"
                      className="block text-sm hover:text-primary transition-colors text-muted-foreground"
                    >
                      → All Articles
                    </Link>
                    <Link
                      href="/dashboard"
                      className="block text-sm hover:text-primary transition-colors text-muted-foreground"
                    >
                      → Get Started
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
