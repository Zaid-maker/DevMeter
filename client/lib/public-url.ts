type RequestLike = {
  headers?: {
    get(name: string): string | null;
  };
};

function sanitizeBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}

function baseUrlFromRequest(req?: RequestLike): string | null {
  if (!req?.headers) return null;

  const forwardedProto = req.headers.get("x-forwarded-proto");
  const forwardedHost = req.headers.get("x-forwarded-host");
  const host = req.headers.get("host");

  const protocol = forwardedProto || (host?.includes("localhost") ? "http" : "https");
  const resolvedHost = forwardedHost || host;

  if (!resolvedHost) return null;
  return sanitizeBaseUrl(`${protocol}://${resolvedHost}`);
}

export function getPublicBaseUrl(req?: RequestLike): string {
  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.SITE_URL;

  if (envUrl) {
    return sanitizeBaseUrl(envUrl);
  }

  if (process.env.VERCEL_URL) {
    return sanitizeBaseUrl(`https://${process.env.VERCEL_URL}`);
  }

  const requestDerived = baseUrlFromRequest(req);
  if (requestDerived) {
    return requestDerived;
  }

  return "http://localhost:3000";
}
