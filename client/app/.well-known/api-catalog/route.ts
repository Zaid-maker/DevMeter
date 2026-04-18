import { NextResponse } from "next/server";

function getPublicBaseUrl(): string {
  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.SITE_URL;

  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

export function GET() {
  const baseUrl = getPublicBaseUrl();

  const linkset = {
    linkset: [
      {
        anchor: `${baseUrl}/api`,
        "service-desc": [
          {
            href: `${baseUrl}/.well-known/openapi.json`,
            type: "application/openapi+json",
            title: "DevMeter OpenAPI description",
          },
        ],
        "service-doc": [
          {
            href: `${baseUrl}/docs`,
            type: "text/html",
            title: "DevMeter API documentation",
          },
        ],
        status: [
          {
            href: `${baseUrl}/api/health`,
            type: "application/json",
            title: "DevMeter API health",
          },
        ],
      },
    ],
  };

  return new NextResponse(JSON.stringify(linkset), {
    status: 200,
    headers: {
      "Content-Type": "application/linkset+json",
      "Cache-Control": "public, max-age=300",
    },
  });
}
