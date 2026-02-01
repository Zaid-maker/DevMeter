import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createFlowPlaylist } from "@/lib/spotify";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    try {
        // Find top tracks based on heartbeat count
        const topTracks = await prisma.heartbeat.groupBy({
            by: ['trackId'],
            where: {
                userId,
                trackId: { not: null }
            },
            _count: {
                id: true
            },
            orderBy: {
                _count: {
                    id: 'desc'
                }
            },
            take: 20
        });

        const trackIds = topTracks.map(t => t.trackId as string);

        const tracks = await prisma.track.findMany({
            where: {
                id: { in: trackIds }
            }
        });

        // Sort them back to the order of topTracks
        const sortedTracks = trackIds.map(id => tracks.find(t => t.id === id)).filter(Boolean);
        const trackUris = sortedTracks.map(t => t!.uri).filter(Boolean) as string[];

        if (trackUris.length === 0) {
            return NextResponse.json({ error: "No tracks found to generate playlist. Start coding with Spotify playing!" }, { status: 400 });
        }

        const playlistUrl = await createFlowPlaylist(userId, trackUris);

        if (!playlistUrl) {
            return NextResponse.json({ error: "Failed to create playlist. Make sure your Spotify account is connected." }, { status: 500 });
        }

        return NextResponse.json({ url: playlistUrl });
    } catch (error) {
        console.error("Playlist generation error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
