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

        const res = NextResponse.redirect(settingsRedirect(req, "linked"));
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
