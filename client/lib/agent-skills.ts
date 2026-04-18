import { createHash } from "node:crypto";

export type LocalAgentSkill = {
  slug: string;
  name: string;
  description: string;
  content: string;
};

export const LOCAL_AGENT_SKILLS: LocalAgentSkill[] = [
  {
    slug: "devmeter-get-stats",
    name: "devmeter-get-stats",
    description: "Retrieve authenticated coding statistics from DevMeter.",
    content: `# Skill: DevMeter Get Stats\n\nUse this skill to fetch a user's coding stats from the DevMeter API.\n\n## Input\n- range: optional value in {today, all}\n\n## Output\n- Total coding hours\n- Projects and language breakdown\n`,
  },
  {
    slug: "devmeter-read-leaderboard",
    name: "devmeter-read-leaderboard",
    description: "Read leaderboard rankings from DevMeter.",
    content: `# Skill: DevMeter Leaderboard\n\nUse this skill to retrieve global leaderboard data from DevMeter.\n\n## Input\n- limit: optional number of rows\n\n## Output\n- Ranked users\n- XP and level details\n`,
  },
];

export function getSkillBySlug(slug: string) {
  return LOCAL_AGENT_SKILLS.find((skill) => skill.slug === slug);
}

export function toSha256Digest(content: string) {
  const hex = createHash("sha256").update(content, "utf8").digest("hex");
  return `sha256:${hex}`;
}
