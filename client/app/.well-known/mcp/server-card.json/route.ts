import { NextResponse } from "next/server";
import { getPublicBaseUrl } from "@/lib/public-url";

export function GET() {
  const baseUrl = getPublicBaseUrl();

  return NextResponse.json({
    serverInfo: {
      name: "devmeter-web",
      version: "1.0.0",
    },
    endpoint: `${baseUrl}/mcp`,
    capabilities: {
      tools: true,
      resources: true,
      prompts: false,
    },
    transports: [
      {
        type: "streamable-http",
        endpoint: `${baseUrl}/mcp`,
      },
    ],
  });
}
