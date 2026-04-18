import { NextResponse } from "next/server";
import { getPublicBaseUrl } from "@/lib/public-url";

export function GET(req: Request) {
  const issuer = getPublicBaseUrl(req);

  return NextResponse.json({
    issuer,
    authorization_endpoint: `${issuer}/api/auth/oauth/authorize`,
    token_endpoint: `${issuer}/api/auth/oauth/token`,
    jwks_uri: `${issuer}/.well-known/jwks.json`,
    grant_types_supported: [
      "authorization_code",
      "refresh_token",
      "client_credentials",
    ],
    response_types_supported: ["code"],
    scopes_supported: ["read:stats", "read:user", "write:heartbeat"],
    token_endpoint_auth_methods_supported: ["client_secret_post", "none"],
  });
}
