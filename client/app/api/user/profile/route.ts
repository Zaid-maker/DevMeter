import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

const RESERVED_SLUGS = new Set([
  "api",
  "app",
  "admin",
  "auth",
  "blog",
  "dashboard",
  "docs",
  "leaderboard",
  "profile",
  "settings",
  "u",
  "terms",
  "privacy",
  "robots.txt",
  "sitemap.xml",
]);

function normalizeSlug(raw: string) {
  return raw.trim().toLowerCase();
}

function isValidSlug(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const slugInput = typeof body.profileSlug === "string" ? body.profileSlug : "";
    const profileSlug = normalizeSlug(slugInput);
    const hasSlug = profileSlug.length > 0;

    if (!name) {
      return NextResponse.json({ error: "Display name is required" }, { status: 400 });
    }

    if (name.length < 2 || name.length > 60) {
      return NextResponse.json({ error: "Display name must be between 2 and 60 characters" }, { status: 400 });
    }

    if (hasSlug && (profileSlug.length < 3 || profileSlug.length > 32)) {
      return NextResponse.json({ error: "Vanity slug must be 3 to 32 characters" }, { status: 400 });
    }

    if (hasSlug && !isValidSlug(profileSlug)) {
      return NextResponse.json(
        { error: "Use lowercase letters, numbers, and single hyphens only" },
        { status: 400 }
      );
    }

    if (hasSlug && RESERVED_SLUGS.has(profileSlug)) {
      return NextResponse.json({ error: "This vanity slug is reserved" }, { status: 400 });
    }

    if (hasSlug) {
      const duplicate = await prisma.user.findFirst({
        where: {
          profileSlug,
          NOT: { id: session.user.id },
        },
        select: { id: true },
      });

      if (duplicate) {
        return NextResponse.json({ error: "This vanity slug is already taken" }, { status: 409 });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        profileSlug: hasSlug ? profileSlug : null,
      },
      select: {
        id: true,
        name: true,
        profileSlug: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
