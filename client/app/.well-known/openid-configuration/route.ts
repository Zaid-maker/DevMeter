import { NextResponse } from "next/server";
import { getPublicBaseUrl } from "@/lib/public-url";

export function GET() {
  const issuer = getPublicBaseUrl();

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
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
    scopes_supported: ["openid", "profile", "email", "read:stats", "read:user"],
    token_endpoint_auth_methods_supported: ["client_secret_post", "none"],
  });
}
