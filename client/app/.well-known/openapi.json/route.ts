import { NextResponse } from "next/server";
import { getPublicBaseUrl } from "@/lib/public-url";

export function GET() {
  const baseUrl = getPublicBaseUrl();

  return NextResponse.json({
    openapi: "3.1.0",
    info: {
      title: "DevMeter API",
      version: "1.0.0",
      description: "Core API endpoints used by DevMeter clients and integrations.",
    },
    servers: [{ url: `${baseUrl}/api` }],
    paths: {
      "/health": {
        get: {
          summary: "Health check",
          responses: {
            "200": {
              description: "Healthy service",
            },
          },
        },
      },
      "/stats": {
        get: {
          summary: "Get authenticated user stats",
          responses: {
            "200": {
              description: "User stats payload",
            },
            "401": {
              description: "Unauthorized",
            },
          },
        },
      },
      "/user": {
        get: {
          summary: "Get authenticated user profile",
          responses: {
            "200": { description: "User profile" },
            "401": { description: "Unauthorized" },
          },
        },
      },
      "/leaderboard": {
        get: {
          summary: "Get leaderboard data",
          responses: {
            "200": {
              description: "Leaderboard payload",
            },
          },
        },
      },
    },
  });
}
