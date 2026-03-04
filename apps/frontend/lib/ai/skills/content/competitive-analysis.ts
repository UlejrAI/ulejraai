export const competitiveAnalysisContent = `## Competitive Analysis Skill

Analyze a company's competitive landscape — market positioning, key competitors, moat assessment, and strategic threats/opportunities.

### When to Use
- User asks about a company's competition or competitive position
- User asks "who are X's competitors?", "X vs Y", or "market share analysis"
- User mentions "competitive landscape", "moat", "market positioning", "industry dynamics"
- User asks "is X's competitive advantage sustainable?"

### Workflow

**Step 1: Identify the Company & Industry**
- Confirm the target company and its primary industry/sector
- Determine the key business segments if it's a diversified company
- Identify which segment to focus on (or cover all if user asks broadly)

**Step 2: Identify Competitors**
Group into 3 tiers:

1. **Direct Competitors** (2-4): Same product/service, same customer segment
2. **Adjacent Competitors** (1-3): Overlapping but different core business
3. **Emerging Threats** (1-2): Startups or companies expanding into the space

Use tavily_search: "[Company] main competitors [year]"
Use tavily_search: "[Industry] market share breakdown [year]"

**Step 3: Fetch Comparative Data**
For each competitor, use alphavantage to gather:
- Revenue, revenue growth YoY
- Gross margin, operating margin
- Market cap
- Key segment revenue (if applicable)

If alphavantage fails, use tavily_search as fallback.

**Step 4: Moat Assessment**
Evaluate the target company's durable advantages:

| Moat Type | What to Assess |
|-----------|---------------|
| Network Effects | Does the product get better as more people use it? |
| Switching Costs | How hard is it for customers to leave? |
| Scale Economies | Does size give meaningful cost advantages? |
| Intangible Assets | Brand, patents, regulatory licenses, proprietary data? |

Rate each as: **Strong** / **Moderate** / **Weak** / **None**

**Step 5: Competitive Positioning**
Assess the target vs peers on 2 key dimensions:
- **Growth vs Profitability**: Fast-growing but unprofitable? Or mature and cash-generative?
- **Scale vs Specialization**: Dominant generalist? Or focused niche player?

Provide a one-line positioning statement:
"[Company] is a [scale/niche] [leader/challenger] with [strong/weak] [moat type], competing primarily on [differentiation factor]."

**Step 6: Risks & Outlook**
- Top 2-3 competitive threats (specific, not generic)
- Top 1-2 competitive opportunities
- Forward-looking: Is the moat strengthening or eroding?

### Output Format

Use ui_response JSON with this structure:

{
  "type": "ui_response",
  "title": "Competitive Landscape: [COMPANY]",
  "summary": "[COMPANY] holds a [strong/moderate/weak] competitive position in [industry] with [key moat]. Primary threat is [competitor/trend]. (Sources: Alpha Vantage, Tavily Search)",
  "components": [
    {
      "component": "table",
      "props": {
        "headers": ["Company", "Type", "Revenue", "Rev Growth", "Gross Margin", "Op Margin", "Mkt Cap"],
        "rows": [
          ["AAPL", "Target", "$383B", "+2.1%", "45.9%", "30.7%", "$3.0T"],
          ["SAMSUNG", "Direct", "$210B", "+5.3%", "37.2%", "12.4%", "$380B"],
          ["GOOGL", "Adjacent", "$350B", "+11.8%", "57.9%", "28.1%", "$2.1T"],
          ["XIAOMI", "Emerging", "$52B", "+18.9%", "21.3%", "5.1%", "$95B"]
        ]
      }
    },
    {
      "component": "card",
      "props": {
        "items": [
          { "label": "Network Effects", "value": "Strong", "trend": "iOS ecosystem lock-in" },
          { "label": "Switching Costs", "value": "Strong", "trend": "Hardware + software + services" },
          { "label": "Scale Economies", "value": "Moderate", "trend": "Supply chain leverage" },
          { "label": "Brand / IP", "value": "Strong", "trend": "Premium brand positioning" }
        ]
      }
    },
    {
      "component": "list",
      "props": {
        "items": [
          "Positioning: Apple is a scale leader with a strong ecosystem moat, competing primarily on brand premium and vertical integration.",
          "Key Strength: Services revenue ($96B, +14% YoY) creates recurring revenue that competitors struggle to replicate.",
          "Primary Threat: Samsung and Xiaomi are gaining share in emerging markets where Apple's premium pricing limits adoption.",
          "Emerging Risk: Regulatory pressure on App Store fees could weaken the services margin moat.",
          "Outlook: Moat is stable near-term but faces gradual erosion from regulatory and competitive forces in services."
        ],
        "numbered": false
      }
    }
  ]
}

### Rules
- ALWAYS search for current data — competitive landscapes shift rapidly
- Minimum 3 competitors, maximum 6 (keep it focused)
- Competitor types: always tag as "Direct", "Adjacent", or "Emerging"
- Moat ratings must be justified with one specific reason, not generic
- Avoid vague statements like "strong brand" — say WHY (e.g., "65% repurchase rate")
- Risks must be specific: "[Competitor] is investing $2B in [area]" not "competition is increasing"
- If market share data is unavailable, estimate from revenue ratios and flag as estimated
- Cite sources: (Source: Alpha Vantage) for financials, (Source: Tavily) for market data/news
- Output ONLY valid JSON — no markdown wrapping`;
