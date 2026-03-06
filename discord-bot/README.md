# DevMeter Discord Role Bot

Automates Discord role assignment for users linked to DevMeter accounts.

## What It Does

- Pulls linked users from `GET /api/admin/discord-role-candidates`
- Evaluates each user against `DISCORD_ROLE_RULES`
- Adds/removes managed Discord roles in the configured guild
- Repeats on a fixed interval

## Setup

1. Create a Discord bot and invite it with `Manage Roles` permission.
2. Ensure bot role is higher than all roles it needs to manage.
3. Copy `.env.example` to `.env` and fill values.
4. Install and run:

```bash
npm install
npm run dev
```

## Environment

- `DISCORD_BOT_TOKEN`: Discord bot token
- `DISCORD_GUILD_ID`: Discord server ID
- `DEVMETER_APP_URL`: Base URL of website API
- `DEV_ADMIN_SECRET`: Must match server `DEV_ADMIN_SECRET`
- `DISCORD_SYNC_WINDOW_DAYS`: Lookback window for activity metrics
- `DISCORD_SYNC_INTERVAL_MS`: Sync frequency in milliseconds
- `DISCORD_DRY_RUN`: `true` to log actions without changing roles
- `DISCORD_ROLE_RULES`: JSON array of role rules

## Role Rule Format

```json
[
  {
    "name": "Bronze",
    "roleId": "123456789012345678",
    "minHours": 5,
    "minHeartbeats": 100
  },
  {
    "name": "Silver",
    "roleId": "223456789012345678",
    "minHours": 20,
    "minLevel": 3,
    "minXp": 300
  }
]
```
