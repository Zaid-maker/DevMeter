import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

interface DiscordTokenResponse {
    access_token: string;
}

interface DiscordUserResponse {
    id: string;
    username: string;
    discriminator: string;
    global_name: string | null;
}

function getRedirectUri(req: NextRequest): string {
    return process.env.DISCORD_REDIRECT_URI || `${req.nextUrl.origin}/api/user/discord/callback`;
}

function settingsRedirect(req: NextRequest, status: string) {
    return new URL(`/settings?tab=profile&discord=${status}`, req.url);
}

async function addUserToDiscordGuild(params: {
    discordUserId: string;
    userAccessToken: string;
}): Promise<boolean> {
    const guildId = process.env.DISCORD_GUILD_ID;
    const botToken = process.env.DISCORD_BOT_TOKEN;

    if (!guildId || !botToken) {
        console.warn("Discord auto-join skipped: DISCORD_GUILD_ID or DISCORD_BOT_TOKEN is missing.");
        return false;
    }

    const controller = new AbortController();
    const timeoutMs = 5000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const joinRes = await fetch(`https://discord.com/api/guilds/${guildId}/members/${params.discordUserId}`, {
            method: "PUT",
            headers: {
                Authorization: `Bot ${botToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                access_token: params.userAccessToken,
            }),
            signal: controller.signal,
        });

        if (!joinRes.ok && joinRes.status !== 201 && joinRes.status !== 204) {
            const body = await joinRes.text().catch(() => "");
            console.error("Discord guild join failed:", {
                status: joinRes.status,
                body,
                guildId,
                discordUserId: params.discordUserId,
            });
            return false;
        }

        return true;
    } catch (error) {
        const isAbort = error instanceof Error && error.name === "AbortError";
        console.error("Discord guild join request error:", {
            error: error instanceof Error ? error.message : String(error),
            aborted: isAbort,
            timeoutMs,
            guildId,
            discordUserId: params.discordUserId,
        });
        return false;
    } finally {
        clearTimeout(timeoutId);
    }
}

export async function GET(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return NextResponse.redirect(new URL("/auth/sign-in", req.url));
    }

    const code = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state");
    const storedState = req.cookies.get("discord_link_state")?.value;

    if (!code || !state || !storedState || storedState !== state) {
        const res = NextResponse.redirect(settingsRedirect(req, "state_error"));
        res.cookies.set("discord_link_state", "", { path: "/", maxAge: 0 });
        return res;
    }

    const [stateUserId] = state.split(":");
    if (!stateUserId || stateUserId !== session.user.id) {
        const res = NextResponse.redirect(settingsRedirect(req, "state_error"));
        res.cookies.set("discord_link_state", "", { path: "/", maxAge: 0 });
        return res;
    }

    const clientId = process.env.DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;
    const redirectUri = getRedirectUri(req);

    if (!clientId || !clientSecret) {
        const res = NextResponse.redirect(settingsRedirect(req, "misconfigured"));
        res.cookies.set("discord_link_state", "", { path: "/", maxAge: 0 });
        return res;
    }

    try {
        const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: "authorization_code",
                code,
                redirect_uri: redirectUri,
            }),
        });

        if (!tokenRes.ok) {
            console.error("Discord token exchange failed:", await tokenRes.text());
            const res = NextResponse.redirect(settingsRedirect(req, "oauth_error"));
            res.cookies.set("discord_link_state", "", { path: "/", maxAge: 0 });
            return res;
        }

        const tokenData = (await tokenRes.json()) as DiscordTokenResponse;

        const userRes = await fetch("https://discord.com/api/users/@me", {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
            },
        });

        if (!userRes.ok) {
            console.error("Discord user fetch failed:", await userRes.text());
            const res = NextResponse.redirect(settingsRedirect(req, "oauth_error"));
            res.cookies.set("discord_link_state", "", { path: "/", maxAge: 0 });
            return res;
        }

        const discordUser = (await userRes.json()) as DiscordUserResponse;
        const displayName = discordUser.global_name
            || (discordUser.discriminator && discordUser.discriminator !== "0"
                ? `${discordUser.username}#${discordUser.discriminator}`
                : discordUser.username);

        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                discordUserId: discordUser.id,
                discordUsername: displayName,
                discordLinkedAt: new Date(),
            },
        });

        const joinedGuild = await addUserToDiscordGuild({
            discordUserId: discordUser.id,
            userAccessToken: tokenData.access_token,
        });

        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                discordJoinStatus: joinedGuild ? "joined" : "failed",
            },
        });

        const res = NextResponse.redirect(settingsRedirect(req, joinedGuild ? "linked" : "linked_join_failed"));
        res.cookies.set("discord_link_state", "", { path: "/", maxAge: 0 });
        return res;
    } catch (error) {
        // Handle unique key conflict when Discord account is already linked elsewhere.
        if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
            const res = NextResponse.redirect(settingsRedirect(req, "already_linked"));
            res.cookies.set("discord_link_state", "", { path: "/", maxAge: 0 });
            return res;
        }

        console.error("Discord callback error:", error);
        const res = NextResponse.redirect(settingsRedirect(req, "internal_error"));
        res.cookies.set("discord_link_state", "", { path: "/", maxAge: 0 });
        return res;
    }
}
