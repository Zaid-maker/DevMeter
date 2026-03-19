import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

function getRedirectUri(req: NextRequest): string {
    return process.env.DISCORD_REDIRECT_URI || `${req.nextUrl.origin}/api/user/discord/callback`;
}

export async function GET(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return NextResponse.redirect(new URL("/auth/sign-in", req.url));
    }

    const clientId = process.env.DISCORD_CLIENT_ID;
    if (!clientId) {
        return NextResponse.redirect(new URL("/settings?tab=profile&discord=misconfigured", req.url));
    }

    const redirectUri = getRedirectUri(req);
    const nonce = randomBytes(24).toString("hex");
    const state = `${session.user.id}:${nonce}`;

    const discordUrl = new URL("https://discord.com/oauth2/authorize");
    discordUrl.searchParams.set("client_id", clientId);
    discordUrl.searchParams.set("response_type", "code");
    discordUrl.searchParams.set("redirect_uri", redirectUri);
    discordUrl.searchParams.set("scope", "identify guilds.join");
    discordUrl.searchParams.set("state", state);
    discordUrl.searchParams.set("prompt", "consent");

    const res = NextResponse.redirect(discordUrl);
    res.cookies.set("discord_link_state", state, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 10,
        path: "/",
    });

    return res;
}
