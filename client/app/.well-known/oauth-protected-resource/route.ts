import { NextResponse } from "next/server";
import { getPublicBaseUrl } from "@/lib/public-url";

export function GET() {
  const baseUrl = getPublicBaseUrl();

  return NextResponse.json({
    resource: `${baseUrl}/api`,
    authorization_servers: [baseUrl],
    scopes_supported: ["read:stats", "read:user", "write:heartbeat"],
  });
}
