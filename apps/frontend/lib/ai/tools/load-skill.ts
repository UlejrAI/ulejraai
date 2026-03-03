import { tool } from "ai";
import { z } from "zod";
import { skillRegistry } from "@/lib/ai/skills/registry";

/**
 * loadSkill tool
 *
 * When the model reads the catalog in the system prompt and determines which skill
 * is required, it calls this tool. The tool returns the complete instructions for
 * the relevant skill — entering the context only when needed.
 */
export const loadSkill = tool({
  description:
    "Load detailed instructions for a specific skill. Call this BEFORE responding whenever the user's request matches a skill in the catalog.",
  inputSchema: z.object({
    skillName: z
      .string()
      .describe(
        "The name of the skill to load, exactly as listed in the catalog (e.g. 'generative-ui', 'economic-brief', 'invoice', 'artifacts')."
      ),
  }),
  execute: async ({ skillName }) => {
    const availableSkills = Object.keys(skillRegistry).join(", ");
    const skill = skillRegistry[skillName];
    if (!skill) {
      return {
        error: `Unknown skill: "${skillName}". Available skills: ${availableSkills}`,
        instructions: null,
      };
    }
    console.log(`[Skill] Loaded: ${skillName}`);
    return {
      skillName: skill.name,
      instructions: skill.content,
    };
  },
});
