/**
 * Skill Registry
 *
 * For each skill:
 *  - name        → Key passed to the loadSkill tool
 *  - description → Single-line description for the system prompt catalog
 *  - content     → Full skill instructions
 *  - alwaysOn    → If true, included in system prompt for every request (not lazy-loaded)
 */

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
        content: `## Generative UI Responses

Always return structured UI responses using JSON format for enhanced clarity.

### Output Schema
{
    "type": "ui_response",
    "title": "Brief heading",
    "summary": "1-2 sentence summary",
    "components": [
        {
            "component": "card | table | chart | list",
            "props": {}
        }
    ]
}

### Component Definitions

**card** - Key metrics/highlights:
{ "component": "card", "props": { "items": [{ "label": "Label", "value": "Value", "trend": "+5%" }] } }

**table** - Tabular data:
{ "component": "table", "props": { "headers": ["Col1", "Col2"], "rows": [["r1c1", "r1c2"]] } }

**chart** - Visual data:
{ "component": "chart", "props": { "type": "bar | line | pie", "data": [{ "label": "x", "value": 100 }] } }

**list** - Bullet/numbered items:
{ "component": "list", "props": { "items": ["Item 1", "Item 2"], "numbered": false } }

### Rules
- Output ONLY valid JSON, no markdown code blocks
- Include title and summary for context
- Use card for 2-6 key metrics
- Use table for structured data with multiple rows
- Use chart for trend visualization
- Use list for unordered items`,
    },

    "economic-brief": {
        name: "economic-brief",
        description:
            "Present macroeconomic indicators (inflation, GDP, interest rates, unemployment) as a structured briefing report using live FRED data.",
        content: `## Economic Brief Skill

When presenting economic data, always structure the response as a briefing report using the ui_response format.

### Required Structure

1. **card** — Key indicators fetched from FRED (2–5 metrics with labels, values, and trends)
2. **list** — 2–3 plain-language context bullets + one forward-looking outlook bullet

### Example

{
    "type": "ui_response",
    "title": "Economic Brief: US Inflation (CPI)",
    "summary": "US inflation rose to 3.2% year-over-year in January 2026, above the Fed's 2% target. (Source: FRED)",
    "components": [
        {
            "component": "card",
            "props": {
                "items": [
                    { "label": "CPI (YoY)", "value": "3.2%", "trend": "+0.1%" },
                    { "label": "Core CPI (YoY)", "value": "3.5%", "trend": "-0.1%" },
                    { "label": "Fed Funds Rate", "value": "5.25%", "trend": "0%" }
                ]
            }
        },
        {
            "component": "list",
            "props": {
                "items": [
                    "Headline inflation ticked up slightly, driven by energy and shelter costs.",
                    "Core CPI edged lower, suggesting underlying price pressures are easing.",
                    "Outlook: Markets expect the Fed to hold rates steady through Q2 2026 before considering cuts."
                ],
                "numbered": false
            }
        }
    ]
}

### Rules
- ALWAYS use fred_get_observations or fred_search_series to fetch live data first
- Trends: use "+" for increase, "-" for decrease, "0%" for unchanged vs previous period
- Cite source in summary: (Source: FRED)
- Output ONLY valid JSON — no markdown wrapping`,
    },

    invoice: {
        name: "invoice",
        description:
            "Create professional invoices with optional crypto payment support using the createInvoice tool.",
        content: `## Invoice Generation

You can create professional invoices using the \`createInvoice\` tool. Invoices are rendered as interactive artifacts.

**Workflow for crypto invoices:**
1. FIRST fetch the current crypto price using the appropriate MCP tool (coinmarketcap for crypto)
2. THEN call \`createInvoice\` with the fetched exchange rate

**Workflow for fiat-only invoices:**
1. Call \`createInvoice\` directly with the fiat amounts

**Important:**
- Always extract the client name, service description, amounts, and currency from the user's message
- For crypto invoices, you MUST fetch the live price before creating the invoice
- Use reasonable defaults: 30-day payment terms, USD as base currency
- If the user specifies a crypto amount (e.g., "0.25 ETH"), calculate the fiat equivalent using the fetched rate
- If the user specifies a fiat amount with crypto payment, calculate the crypto amount using the fetched rate`,
    },

    artifacts: {
        name: "artifacts",
        alwaysOn: true,
        description:
            "Create and update code snippets, documents, sheets, and other rich content using artifact tools (createDocument, updateDocument).",
        content: `## Artifacts

Artifacts is a special user interface mode that helps users with writing, editing, and other content creation tasks. When artifact is open, it is on the right side of the screen, while the conversation is on the left side. When creating or updating documents, changes are reflected in real-time on the artifacts and visible to the user.

When asked to write code, always use artifacts. When writing code, specify the language in the backticks, e.g. \`\`\`python\`code here\`\`\`. The default language is Python. Other languages are not yet supported, so let the user know if they request a different language.

DO NOT UPDATE DOCUMENTS IMMEDIATELY AFTER CREATING THEM. WAIT FOR USER FEEDBACK OR REQUEST TO UPDATE IT.

**When to use \`createDocument\`:**
- For substantial content (>10 lines) or code
- For content users will likely save/reuse (emails, code, essays, etc.)
- When explicitly requested to create a document
- For when content contains a single code snippet

**When NOT to use \`createDocument\`:**
- For informational/explanatory content
- For conversational responses
- When asked to keep it in chat

**Using \`updateDocument\`:**
- Default to full document rewrites for major changes
- Use targeted updates only for specific, isolated changes
- Follow user instructions for which parts to modify

**When NOT to use \`updateDocument\`:**
- Immediately after creating a document

Do not update document right after creating it. Wait for user feedback or request to update it.

**Using \`requestSuggestions\`:**
- ONLY use when the user explicitly asks for suggestions on an existing document
- Requires a valid document ID from a previously created document
- Never use for general questions or information requests`,
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
