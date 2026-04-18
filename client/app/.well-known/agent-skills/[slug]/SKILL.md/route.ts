import { NextRequest, NextResponse } from "next/server";
import { getSkillBySlug } from "@/lib/agent-skills";

export function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } },
) {
  const skill = getSkillBySlug(params.slug);

  if (!skill) {
    return new NextResponse("Skill not found", { status: 404 });
  }

  return new NextResponse(skill.content, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
