import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "devmeter-api",
    time: new Date().toISOString(),
  });
}
