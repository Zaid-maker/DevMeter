import { NextResponse } from "next/server";
import { LOCAL_AGENT_SKILLS, toSha256Digest } from "@/lib/agent-skills";
import { getPublicBaseUrl } from "@/lib/public-url";

export function GET(req: Request) {
  const baseUrl = getPublicBaseUrl(req);

  const payload = {
    $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
    skills: LOCAL_AGENT_SKILLS.map((skill) => ({
      name: skill.name,
      type: "skill-md",
      description: skill.description,
      url: `${baseUrl}/.well-known/agent-skills/${skill.slug}/SKILL.md`,
      digest: toSha256Digest(skill.content),
    })),
  };

  return NextResponse.json(payload);
}
