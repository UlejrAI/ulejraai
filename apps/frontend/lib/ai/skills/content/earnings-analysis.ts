export const earningsAnalysisContent = `## Earnings Analysis Skill

Analyze a company's most recent quarterly earnings results with beat/miss assessment, key metric changes, and forward outlook.

### When to Use
- User asks about earnings, quarterly results, or "how did X report?"
- User mentions "Q1/Q2/Q3/Q4 results", "earnings beat/miss", "quarterly update"
- User asks "what happened with X's earnings?" or "X earnings analysis"

### Workflow

**Step 1: Fetch Latest Earnings Data**
CRITICAL: Do NOT rely on training data. Always search for the latest results.

1. Use tavily_search: "[Company] latest quarterly earnings results [current year]"
2. Use tavily_search: "[Company] earnings call highlights [quarter] [year]"
3. Use alphavantage to fetch: current price, EPS history, revenue history
4. Verify the data is from the MOST RECENT quarter (not an old one)

**Step 2: Beat/Miss Analysis**
For each key metric, determine:
- **Actual vs Consensus**: Did the company beat or miss estimates?
- **Magnitude**: By how much? ("Revenue beat by $120M or 3%")
- **Vs Prior Year**: YoY change for context

Key metrics to assess:
- Revenue (total and by segment if available)
- EPS (GAAP and adjusted)
- Gross margin
- Operating income / EBITDA
- Guidance (raised, maintained, or lowered?)

**Step 3: Identify What's New**
Focus ONLY on what changed this quarter:
- Surprises (positive or negative)
- Guidance changes vs prior quarter
- New strategic initiatives or risks mentioned
- Margin trajectory shift
- Any one-time items affecting results

**Step 4: Stock Reaction**
- Post-earnings price move (if available from search)
- Whether the market reaction aligns with the results

### Output Format

Use ui_response JSON with this structure:

{
  "type": "ui_response",
  "title": "Earnings Update: [COMPANY] [QUARTER] [YEAR]",
  "summary": "[COMPANY] [beat/missed] on revenue ($X.XB vs $X.XB est.) and [beat/missed] on EPS ($X.XX vs $X.XX est.). Stock [rose/fell] X% after-hours. (Sources: Alpha Vantage, Tavily Search)",
  "components": [
    {
      "component": "table",
      "props": {
        "headers": ["Metric", "Actual", "Estimate", "Beat/Miss", "YoY Change"],
        "rows": [
          ["Revenue", "$94.8B", "$92.1B", "Beat +2.9%", "+6.1% YoY"],
          ["EPS (Adj)", "$2.18", "$2.10", "Beat +3.8%", "+11.2% YoY"],
          ["Gross Margin", "46.3%", "45.8%", "Beat +50bps", "+120bps YoY"],
          ["Operating Income", "$29.4B", "$28.5B", "Beat +3.2%", "+8.5% YoY"]
        ]
      }
    },
    {
      "component": "card",
      "props": {
        "items": [
          { "label": "Revenue", "value": "$94.8B", "trend": "+6.1% YoY" },
          { "label": "EPS", "value": "$2.18", "trend": "+11.2% YoY" },
          { "label": "Gross Margin", "value": "46.3%", "trend": "+1.2pp YoY" },
          { "label": "Stock Reaction", "value": "+3.2%", "trend": "after-hours" }
        ]
      }
    },
    {
      "component": "list",
      "props": {
        "items": [
          "Revenue beat driven by stronger-than-expected iPhone and Services growth.",
          "Gross margin expanded YoY on favorable product mix and component cost reductions.",
          "Management raised Q2 guidance above consensus, signaling continued momentum.",
          "Key risk: China revenue declined 4% YoY, underperforming other regions.",
          "Outlook: Consensus estimates likely to move higher following the beat and raised guidance."
        ],
        "numbered": false
      }
    }
  ]
}

### Rules
- ALWAYS search for the latest earnings first — never use stale training data
- Verify the quarter/year is the most recent available
- If consensus estimates are unavailable, compare to prior quarter and prior year instead
- Beat/miss format: "Beat +X.X%" or "Miss -X.X%" with both absolute and percentage
- YoY change: always include for context
- Guidance: always mention if raised/maintained/lowered and vs consensus
- If earnings haven't been reported yet, tell the user the expected date instead
- Cite sources: (Source: Alpha Vantage) for financial data, (Source: Tavily) for news/estimates
- Format: "$94.8B" for revenue, "$2.18" for EPS, "46.3%" for margins, "+120bps" for basis points
- Output ONLY valid JSON — no markdown wrapping`;
