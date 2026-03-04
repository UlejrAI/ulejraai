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
import { dcfValuationContent } from "./content/dcf-valuation";
import { earningsAnalysisContent } from "./content/earnings-analysis";
import { economicBriefContent } from "./content/economic-brief";
import { generativeUiContent } from "./content/generative-ui";
import { invoiceContent } from "./content/invoice";
import { marketOverviewContent } from "./content/market-overview";

export interface SkillMeta {
    name: string;
    description: string;
    content: string;
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
            "Compare a company against its peers using valuation multiples (EV/Revenue, EV/EBITDA, P/E) and operating metrics from FMP. Use for peer benchmarking, relative valuation, or finding undervalued/overvalued stocks.",
        content: compsAnalysisContent,
    },

    "earnings-analysis": {
        name: "earnings-analysis",
        description:
            "Analyze a company's most recent quarterly earnings — beat/miss assessment, key metrics, guidance changes, and stock reaction using FMP and Tavily data.",
        content: earningsAnalysisContent,
    },

    "competitive-analysis": {
        name: "competitive-analysis",
        description:
            "Analyze a company's competitive landscape — key competitors, market positioning, moat assessment (network effects, switching costs, scale, brand), and strategic threats using FMP financial data and Tavily market research.",
        content: competitiveAnalysisContent,
    },

    "dcf-valuation": {
        name: "dcf-valuation",
        description:
            "Build a DCF (Discounted Cash Flow) valuation model for a company using live FMP data. Calculates intrinsic value with sensitivity analysis and compares to market price. Use when user asks about fair value, intrinsic value, or whether a stock is overvalued/undervalued.",
        content: dcfValuationContent,
    },

    "market-overview": {
        name: "market-overview",
        description:
            "Provide a real-time market snapshot covering major stock indices (S&P 500, Nasdaq, Dow), top gainers/losers, Bitcoin, Ethereum, gold, forex, and today's key market narrative using FMP and Tavily.",
        content: marketOverviewContent,
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

export function buildAlwaysOnPrompt(): string {
    return Object.values(skillRegistry)
        .filter((s) => s.alwaysOn)
        .map((s) => s.content)
        .join("\n\n");
}

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
