import { NextResponse } from "next/server";
import { getPublicBaseUrl } from "@/lib/public-url";

export function GET(req: Request) {
  const baseUrl = getPublicBaseUrl(req);

  return NextResponse.json({
    resource: `${baseUrl}/api`,
    authorization_servers: [baseUrl],
    scopes_supported: ["read:stats", "read:user", "write:heartbeat"],
  });
}
