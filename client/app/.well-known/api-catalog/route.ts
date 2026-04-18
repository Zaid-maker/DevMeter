import { NextResponse } from "next/server";
import { getPublicBaseUrl } from "@/lib/public-url";

export function GET(req: Request) {
  const baseUrl = getPublicBaseUrl(req);

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
