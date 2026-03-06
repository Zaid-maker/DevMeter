declare namespace NodeJS {
    interface ProcessEnv {
        DISCORD_BOT_TOKEN?: string;
        DISCORD_GUILD_ID?: string;
        DEV_ADMIN_SECRET?: string;
        DEVMETER_APP_URL?: string;
        DISCORD_SYNC_WINDOW_DAYS?: string;
        DISCORD_SYNC_INTERVAL_MS?: string;
        DISCORD_DRY_RUN?: string;
        DISCORD_ROLE_RULES?: string;
    }
}
