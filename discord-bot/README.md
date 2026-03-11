# DevMeter Discord Role Bot

Automates Discord role assignment for users linked to DevMeter accounts.

## What It Does

- **Auto-creates Discord roles** on first startup if they don't exist (from `DISCORD_ROLES` env)
- Pulls linked users from `GET /api/admin/discord-role-candidates`
- Evaluates each user against `DISCORD_ROLE_RULES`
- Adds/removes managed Discord roles in the configured guild
- Repeats on a fixed interval

## Setup

1. Create a Discord bot and invite it with `Manage Roles` permission.
2. Ensure bot role is higher than all roles it needs to manage.
3. Copy `.env.example` to `.env` and fill values.
4. **Configure roles to create** in `DISCORD_ROLES` (see below).
5. Install and run:

```bash
npm install
npm run dev
```

The bot will log created role IDs on startup - use these in your `DISCORD_ROLE_RULES`.

## Environment

- `DISCORD_BOT_TOKEN`: Discord bot token
- `DISCORD_GUILD_ID`: Discord server ID
- `DEVMETER_APP_URL`: Base URL of website API
- `DISCORD_SYNC_SECRET`: Dedicated secret for Discord sync endpoints (must match server `DISCORD_SYNC_SECRET`)
- `DISCORD_SYNC_WINDOW_DAYS`: Lookback window for activity metrics
- `DISCORD_SYNC_INTERVAL_MS`: Sync frequency in milliseconds
- `DISCORD_DRY_RUN`: `true` to log actions without changing roles
- `DISCORD_ROLES`: JSON array defining roles to auto-create (see below)
- `DISCORD_ROLE_RULES`: JSON array of role rules

## Auto-Create Roles

Define roles to create automatically on bot startup:

```json
[
  {
    "name": "Bronze",
    "color": "#CD7F32",
    "hoist": true,
    "mentionable": false
  },
  {
    "name": "Silver",
    "color": "#C0C0C0",
    "hoist": true
  },
  {
    "name": "Gold",
    "color": "#FFD700",
    "hoist": true
  }
]
```

On startup, the bot will:

- Check if each role exists (by name)
- Create missing roles with specified color/settings
- Log the role IDs for you to use in `DISCORD_ROLE_RULES`

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
