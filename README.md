# DevMeter - Automatic Coding Time Tracker

<div align="center">

<img src="./extension/resources/icon.png" alt="DevMeter Logo" width="120" height="120" />

**Track your coding time. No cap, no paywalls, no mid features.**

*WakaTime's free & superior cousin. The time tracker that actually slaps.* 🔥

[![VS Code Extension](https://img.shields.io/badge/VS%20Code-Extension-007ACC?style=for-the-badge&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=DevMitrza.devmeter)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/devmeter?style=for-the-badge)](https://github.com/devmeter)

[🌐 Website](https://devmeter-v2.zaidcode.me) • [📚 Documentation](https://devmeter-v2.zaidcode.me/docs) • [📖 Blog](https://devmeter-v2.zaidcode.me/blog) • [🏆 Leaderboard](https://devmeter-v2.zaidcode.me/leaderboard)

</div>

---

## 📋 Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Usage](#-usage)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Technology Stack](#-technology-stack)
- [Configuration](#-configuration)
- [API Documentation](#-api-documentation)
- [Self-Hosting with Docker](#-self-hosting-with-docker)
- [Development](#-development)
- [Contributing](#-contributing)
- [Roadmap](#-roadmap)
- [FAQ](#-faq)
- [Support](#-support)
- [License](#-license)

---

## ✨ Features

### 🎯 Automatic Time Tracking

- **Zero Setup Required**: Install the extension and start tracking immediately
- **Seamless Integration**: Runs silently in the background while you code
- **Smart Detection**: Automatically detects when you're actively coding
- **No Manual Logging**: Forget about manually logging your time

### 📊 Comprehensive Analytics

- **Daily Statistics**: View your coding time breakdown by day
- **Project Analytics**: Understand time spent on each project
- **Language Insights**: See which programming languages you use most
- **Focus Time Metrics**: Identify your peak productivity hours
- **Trends & Patterns**: Discover your coding habits and patterns

### 💻 Multi-Language Support

- **JavaScript/TypeScript**: Full support
- **Python**: Complete tracking
- **Java**: Java file tracking
- **C/C++**: C and C++ files
- **Go**: Go language support
- **Rust**: Rust file tracking
- **And More**: 50+ languages supported

### 🏆 Gamification Features

- **Leaderboard**: Compete with other developers
- **Achievements**: Unlock badges and milestones
- **Streaks**: Maintain coding streaks
- **Rankings**: See where you rank globally

### 🔒 Privacy & Security

- **Local Storage**: Your data stays on your machine
- **Encrypted Sync**: Optional cloud sync with encryption
- **No Keystroke Logging**: We only track file activity
- **GDPR Compliant**: Full data control and export

### 📱 Cross-Platform

- **VS Code**: Native extension
- **Web Dashboard**: Monitor your stats online
- **Mobile Ready**: Responsive design for all devices

---

## 🚀 Why DevMeter > WakaTime

| Feature | DevMeter | WakaTime |
|---------|----------|----------|
| **Price** | 💰 100% Free | 😭 Paid plans only |
| **Open Source** | ✅ Yes | ❌ No |
| **Data Privacy** | 🔒 Local first | ⚠️ Cloud dependent |
| **No Ads** | ✅ None | ❌ Limited ads |
| **Customization** | ✅ Full control | ❌ Limited |
| **Community** | 🤝 Growing fast | 📉 Corporate |

**The move?** Switch to DevMeter. It's free, it's open-source, and it actually respects your data. WakaTime who? 👀

---

## 🚀 Quick Start

### Installation

**Option 1: VS Code Marketplace (Recommended)**

```bash
# Install via VS Code Extensions
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "DevMeter"
4. Click Install
```

**Option 2: Command Line**

```bash
code --install-extension DevMitrza.devmeter
```

**Option 3: Direct Download**

- Visit [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=DevMitrza.devmeter)
- Click "Install"

### First Steps

1. **Install the Extension** → DevMeter automatically starts tracking
2. **Create Account** → Sign up at [devmeter-v2.zaidcode.me](https://devmeter-v2.zaidcode.me)
3. **View Dashboard** → Check your stats in real-time
4. **Explore Features** → Check docs for advanced usage

---

## 📦 Installation

### Prerequisites

- **VS Code**: Version 1.70.0 or higher
- **Node.js**: Version 16+ (for development)
- **Bun**: Package manager (for development)

### Extension Installation

#### From Marketplace

1. Open VS Code
2. Press `Ctrl+Shift+X` (Windows/Linux) or `Cmd+Shift+X` (Mac)
3. Search for "DevMeter"
4. Click the "Install" button
5. Reload VS Code when prompted

#### From Command Line

```bash
code --install-extension DevMitrza.devmeter
```

#### From Source (Development)

```bash
# Clone the repository
git clone https://github.com/devmeter/devmeter.git
cd devmeter

# Install dependencies
bun install

# Build the extension
bun run build:extension

# Run in development mode
bun run dev:extension
```

### Web Dashboard Setup

```bash
# Navigate to client directory
cd client

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run development server
bun run dev

# Build for production
bun run build

# Start production server
bun start
```

---

## 💡 Usage

### Basic Usage

1. **Install the Extension**
   - Once installed, DevMeter automatically starts tracking your coding sessions

2. **View Real-Time Stats**
   - Open the DevMeter panel in VS Code sidebar
   - See today's coding time, active project, and session stats

3. **Access Web Dashboard**
   - Visit [devmeter-v2.zaidcode.me](https://devmeter-v2.zaidcode.me)
   - Sign in with your account
   - View comprehensive analytics and history

4. **Analyze Your Patterns**
   - Check which projects consume the most time
   - Identify your peak productivity hours
   - Review language proficiency distribution

### Dashboard Features

**Dashboard Tab**

- Overview of today's stats
- Weekly activity chart
- Current session information
- Quick access to settings

**Analytics Tab**

- Detailed time tracking by project
- Language breakdown
- Daily/weekly/monthly trends
- Productivity insights

**Leaderboard Tab**

- Global rankings
- Compare with other developers
- Category-based rankings
- Achievement showcase

**Settings Tab**

- Privacy preferences
- Notification settings
- Data sync options
- Account management

### VS Code Extension

**Status Bar**

- See your current coding time at the bottom of the editor
- Quick access to pause/resume tracking

**Activity Sidebar**

- Real-time session stats
- Today's breakdown
- Project selector
- Quick settings menu

---

## 🏗️ Architecture

DevMeter is built as a **full-stack application** with three main components:

```
┌─────────────────────────────────────────┐
│         VS Code Extension               │
│  (TypeScript, Activity Monitoring)      │
└──────────────┬──────────────────────────┘
               │ API Calls
┌──────────────▼──────────────────────────┐
│     Analytics Backend API                │
│  (Node.js, Express, Prisma ORM)         │
│  - Time Tracking                         │
│  - User Authentication                   │
│  - Data Aggregation                      │
└──────────────┬──────────────────────────┘
               │ REST/GraphQL
┌──────────────▼──────────────────────────┐
│       Web Dashboard                      │
│  (Next.js, React, TypeScript)           │
│  - Real-time Analytics                   │
│  - User Profile                          │
│  - Leaderboard                           │
└─────────────────────────────────────────┘
```

### Components

**Extension** (`/extension`)

- Monitors editor activity
- Tracks file changes and focus
- Syncs data to backend
- Provides status bar UI

**Backend API** (`/api`)

- RESTful API for data management
- Authentication & authorization
- Analytics computation
- Database operations

**Web Dashboard** (`/client`)

- React-based UI
- Real-time data visualization
- User management
- Settings and preferences

---

## 📁 Project Structure

```
devmeter/
├── extension/                 # VS Code Extension
│   ├── src/
│   │   └── extension.ts      # Extension entry point
│   ├── package.json
│   └── tsconfig.json
│
├── client/                   # Web Dashboard (Next.js)
│   ├── app/
│   │   ├── api/             # API routes
│   │   ├── auth/            # Authentication pages
│   │   ├── blog/            # Blog pages
│   │   ├── dashboard/       # Main dashboard
│   │   ├── leaderboard/     # Leaderboard
│   │   ├── profile/         # User profile
│   │   ├── docs/            # Documentation
│   │   └── layout.tsx       # Root layout
│   ├── components/          # Reusable components
│   ├── lib/                 # Utilities & services
│   ├── prisma/              # Database schema
│   └── public/              # Static assets
│
├── analytics/               # Analytics/Reporting (Vite)
│   ├── src/
│   └── package.json
│
└── README.md               # This file
```

---

## 🛠️ Technology Stack

### Frontend

- **Framework**: Next.js 14+ (React)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Hooks
- **HTTP Client**: Fetch API

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **Validation**: Zod

### Extension

- **Language**: TypeScript
- **Framework**: VS Code Extension API
- **Package Manager**: npm/bun

### DevOps & Tools

- **Package Manager**: Bun (client), npm (extension)
- **Build Tool**: Vite (analytics), Next.js (client)
- **Version Control**: Git
- **Environment**: ESLint, Prettier

---

## ⚙️ Configuration

### Environment Variables

Create `.env.local` in the client directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/devmeter"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# API
NEXT_PUBLIC_API_URL="http://localhost:3000/api"

# Third-party
GITHUB_ID="your-github-app-id"
GITHUB_SECRET="your-github-app-secret"
```

### Extension Configuration

In VS Code settings (`settings.json`):

```json
{
  "devmeter.apiUrl": "https://devmeter-v2.zaidcode.me/api",
  "devmeter.autoSync": true,
  "devmeter.enableNotifications": true,
  "devmeter.privacyMode": false,
  "devmeter.trackedLanguages": ["javascript", "typescript", "python"]
}
```

---

## 📡 API Documentation

### Base URL

```
https://devmeter-v2.zaidcode.me/api
```

### Authentication

All requests require a Bearer token:

```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### User Endpoints

```
GET    /api/user              # Get current user
PATCH  /api/user              # Update profile
DELETE /api/user              # Delete account
```

#### Stats Endpoints

```
GET    /api/stats             # Get today's stats
GET    /api/stats/daily       # Get daily breakdown
GET    /api/stats/weekly      # Get weekly stats
GET    /api/stats/monthly     # Get monthly stats
GET    /api/stats/:metric     # Get specific metric
```

#### Session Endpoints

```
POST   /api/session/start     # Start new session
POST   /api/session/end       # End current session
GET    /api/session/current   # Get active session
```

#### Leaderboard Endpoints

```
GET    /api/leaderboard       # Get global rankings
GET    /api/leaderboard/:category  # Get category rankings
GET    /api/leaderboard/user/:id   # Get user rank
```

See [API Documentation](https://devmeter-v2.zaidcode.me/docs) for detailed endpoint specs.

---

## 🐳 Self-Hosting with Docker

Deploy DevMeter on your own server or homelab with a single command. The Docker Compose stack includes everything you need: the app, PostgreSQL, Redis, and an Upstash-compatible REST proxy.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- A [Resend](https://resend.com) API key (free tier) for email OTP login

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/Zaid-maker/DevMeter.git
cd DevMeter

# 2. Create your environment file
cp client/.env.example client/.env

# 3. Edit client/.env with your settings
#    - Set BETTER_AUTH_SECRET to a random string
#    - Set RESEND_API_KEY to your Resend key
#    - Set EMAIL_FROM to your verified sender address

# 4. Launch the full stack
docker compose up -d

# 5. Visit http://localhost:3000
```

### Services Overview

| Service | Port | Description |
|---------|------|-------------|
| **devmeter** | `3000` | Next.js web app & API |
| **postgres** | `5432` | PostgreSQL 16 database |
| **redis** | `6379` | Redis 7 cache |
| **redis-http** | `8079` | Upstash REST API proxy |

### Data Persistence

All data is stored in named Docker volumes:
- `postgres_data` — your database
- `redis_data` — cache data

To back up your database:

```bash
docker exec devmeter-postgres pg_dump -U devmeter devmeter > backup.sql
```

### Updating

```bash
git pull
docker compose up -d --build
```

---

## 🔧 Development

### Prerequisites

- Node.js 16+
- Bun package manager
- PostgreSQL (or Docker)
- VS Code

### Setup Development Environment

```bash
# Clone repository
git clone https://github.com/devmeter/devmeter.git
cd devmeter

# Install dependencies
bun install

# Setup database
bun run prisma:setup

# Run development servers
bun run dev

# In separate terminal: Run extension in watch mode
cd extension
bun run dev
```

### Available Scripts

```bash
# Development
bun run dev              # Start all dev servers
bun run dev:client       # Start client dev server
bun run dev:extension    # Start extension in watch mode

# Building
bun run build            # Build all packages
bun run build:client     # Build client
bun run build:extension  # Build extension

# Database
bun run prisma:setup     # Setup database
bun run prisma:migrate   # Run migrations
bun run prisma:studio    # Open Prisma Studio

# Code Quality
bun run lint             # Run ESLint
bun run format           # Format with Prettier
bun run type-check       # TypeScript type checking

# Testing
bun run test             # Run tests
bun run test:watch       # Run tests in watch mode
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add your feature description"

# Push and create PR
git push origin feature/your-feature-name
```

---

## 🤝 Contributing

We love contributions! Here's how you can help:

### Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/devmeter.git`
3. Create a feature branch: `git checkout -b feature/amazing-feature`
4. Make your changes
5. Commit: `git commit -m 'feat: add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Create a Pull Request

### Development Workflow

1. **Follow Code Standards**
   - Use TypeScript for type safety
   - Follow ESLint rules
   - Use Prettier for formatting

2. **Testing**
   - Write tests for new features
   - Ensure all tests pass: `bun run test`

3. **Documentation**
   - Update README if needed
   - Add JSDoc comments
   - Update API docs

4. **Commit Messages**
   - Use conventional commits: `feat:`, `fix:`, `docs:`, etc.
   - Be descriptive and concise

### Areas We Need Help With

- 🐛 Bug fixes
- ✨ New features
- 📚 Documentation
- 🎨 UI/UX improvements
- 🌍 Translations
- 📝 Blog posts and tutorials

---

## 🗺️ Roadmap

### Q1 2026

- [ ] Dark mode improvements
- [ ] Advanced filtering in analytics
- [ ] Keyboard shortcuts customization
- [ ] Export data to CSV/JSON

### Q2 2026

- [ ] Team collaboration features
- [ ] Custom goals and targets
- [ ] Integration with project management tools
- [ ] Mobile app beta

### Q3 2026

- [ ] AI-powered insights
- [ ] Automated reports
- [ ] Slack integration
- [ ] GitHub integration

### Future

- [ ] VS Code Web version
- [ ] JetBrains IDE support
- [ ] Vim/Neovim integration
- [ ] Enterprise features

---

## ❓ FAQ

### How does DevMeter track my coding time?

DevMeter monitors when you're actively editing files in VS Code. It tracks file changes and editor focus to determine when you're coding.

### Is my code data stored?

No. DevMeter only stores metadata about your coding sessions (time, language, file names). Your actual code is never sent to our servers.

### Can I use DevMeter offline?

Yes! The extension works offline and syncs your data when you're back online.

### How is my data protected?

- Data is encrypted in transit (HTTPS)
- Passwords are hashed with bcrypt
- Optional end-to-end encryption for sensitive data
- GDPR compliant data handling

### Can I delete my data?

Yes. You can delete your account and all associated data anytime from Settings → Account → Delete Account.

### Is DevMeter free?

Yes, DevMeter is completely free and open-source!

### How do I report a bug?

Please create an issue on [GitHub Issues](https://github.com/devmeter/devmeter/issues) with:

- Description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)

### How can I request a feature?

Create a feature request on [GitHub Discussions](https://github.com/devmeter/devmeter/discussions) with:

- Description of the feature
- Use case and benefits
- Mockups or examples (if applicable)

### What's your privacy policy?

See our [Privacy Policy](https://devmeter-v2.zaidcode.me/privacy) for complete details.

---

## 💬 Support

### Getting Help

**Documentation**

- [Full Documentation](https://devmeter-v2.zaidcode.me/docs)
- [Blog & Tutorials](https://devmeter-v2.zaidcode.me/blog)
- [FAQ](https://devmeter-v2.zaidcode.me/docs#faq)

**Community**

- [GitHub Discussions](https://github.com/devmeter/devmeter/discussions)
- [GitHub Issues](https://github.com/devmeter/devmeter/issues)

**Contact**

- Email: <support@devmeter.io>
- X: [@devmeter_stroke](https://x.com/devmeter_stroke)
- Discord: [Join Community](https://discord.gg/devmeter)

---

## 📄 License

DevMeter is open source and available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

Thanks to all our contributors, users, and the open-source community for making DevMeter possible!

### Built With

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Next.js](https://nextjs.org)
- [Prisma](https://www.prisma.io)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)

---

<div align="center">

**Made with ❤️ by the DevMeter Team**

[⭐ Star us on GitHub](https://github.com/devmeter/devmeter) • [𝕏 Follow us on X](https://x.com/devmeter_stroke) • [💬 Join our Community](https://discord.gg/devmeter)

© 2026 DevMeter. All rights reserved.

</div>
