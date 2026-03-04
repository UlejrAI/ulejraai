/**
 * Skill Registry
 *
 * For each skill:
 *  - name        → Key passed to the loadSkill tool
 *  - description → Single-line description for the system prompt catalog
 *  - content     → Full skill instructions (imported from content/)
 *  - alwaysOn    → If true, included in system prompt for every request (not lazy-loaded)
 */

import { artifactsContent } from "./content/artifacts";
import { competitiveAnalysisContent } from "./content/competitive-analysis";
import { compsAnalysisContent } from "./content/comps-analysis";
import { earningsAnalysisContent } from "./content/earnings-analysis";
import { economicBriefContent } from "./content/economic-brief";
import { generativeUiContent } from "./content/generative-ui";
import { invoiceContent } from "./content/invoice";

export interface SkillMeta {
    name: string;
    description: string;
    content: string;
    /** Should this be included in system prompt for every request? (for frequently used skills) */
    alwaysOn?: boolean;
}

export const skillRegistry: Record<string, SkillMeta> = {
    "generative-ui": {
        name: "generative-ui",
        alwaysOn: true,
        description:
            "Format responses as structured visual UI (cards, tables, charts, lists) using the ui_response JSON schema.",
        content: generativeUiContent,
    },

    "economic-brief": {
        name: "economic-brief",
        description:
            "Present macroeconomic indicators (inflation, GDP, interest rates, unemployment) as a structured briefing report using live FRED data.",
        content: economicBriefContent,
    },
    "comps-analysis": {
        name: "comps-analysis",
        description:
            "Compare a company against its peers using valuation multiples (EV/Revenue, EV/EBITDA, P/E) and operating metrics. Use for peer benchmarking, relative valuation, or finding undervalued/overvalued stocks.",
        content: compsAnalysisContent,
    },
    "earnings-analysis": {
        name: "earnings-analysis",
        description:
            "Analyze a company's most recent quarterly earnings — beat/miss assessment, key metrics, guidance changes, and stock reaction. Use when user asks about earnings, quarterly results, or post-earnings analysis.",
        content: earningsAnalysisContent,
    },


    "competitive-analysis": {
        name: "competitive-analysis",
        description:
            "Analyze a company's competitive landscape — key competitors, market positioning, moat assessment (network effects, switching costs, scale, brand), and strategic threats. Use when user asks about competition, market share, or competitive advantages.",
        content: competitiveAnalysisContent,
    },




    invoice: {
        name: "invoice",
        description:
            "Create professional invoices with optional crypto payment support using the createInvoice tool.",
        content: invoiceContent,
    },

    artifacts: {
        name: "artifacts",
        alwaysOn: true,
        description:
            "Create and update code snippets, documents, sheets, and other rich content using artifact tools (createDocument, updateDocument).",
        content: artifactsContent,
    },
};

/** Combines always-on skill content included in every request's system prompt */
export function buildAlwaysOnPrompt(): string {
    return Object.values(skillRegistry)
        .filter((s) => s.alwaysOn)
        .map((s) => s.content)
        .join("\n\n");
}

/** Generates catalog of only lazy-loaded skills (excluding always-on) */
export function buildSkillCatalog(): string {
    const lazySkills = Object.values(skillRegistry).filter((s) => !s.alwaysOn);

    if (lazySkills.length === 0) return "";

    const lines = lazySkills
        .map((s) => `- **${s.name}**: ${s.description}`)
        .join("\n");

    return `## Additional Skills (load on demand)
When the user's request matches a skill below, call the \`loadSkill\` tool with that skill's name BEFORE responding.

${lines}`;
}
