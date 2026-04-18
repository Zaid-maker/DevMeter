import { NextRequest, NextResponse } from "next/server";

function toMarkdown(pathname: string) {
  return [
    "# DevMeter",
    "",
    "DevMeter is an automatic coding time tracker and analytics platform for developers.",
    "",
    "## Key Links",
    "- Home: /",
    "- Documentation: /docs",
    "- API Catalog: /.well-known/api-catalog",
    "- OpenAPI: /.well-known/openapi.json",
    "",
    "## Requested Path",
    `- ${pathname}`,
    "",
  ].join("\n");
}

function approximateTokens(markdown: string) {
  return markdown.trim().split(/\s+/).filter(Boolean).length.toString();
}

export function middleware(req: NextRequest) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return NextResponse.next();
  }

  const accept = req.headers.get("accept") || "";
  const wantsMarkdown = accept.toLowerCase().includes("text/markdown");

  if (!wantsMarkdown) {
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;
  const markdown = toMarkdown(pathname);

  return new NextResponse(markdown, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "x-markdown-tokens": approximateTokens(markdown),
      Vary: "Accept",
    },
  });
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico|.*\\..*).*)"],
};
