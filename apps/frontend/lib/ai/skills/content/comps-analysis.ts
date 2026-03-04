export const compsAnalysisContent = `## Comparable Company Analysis Skill

Build a peer comparison analysis for a given company using valuation multiples and operating metrics.

### When to Use
- User asks to compare a company against peers/competitors
- User asks "is X undervalued/overvalued?"
- User asks for valuation multiples, peer benchmarking, or sector comparison
- User mentions "comps", "comparable", "peer analysis", or "relative valuation"

### Workflow

**Step 1: Identify the Target & Peer Group**
- Confirm the target company ticker
- Select 3-6 comparable companies (same sector, similar business model, similar scale)
- If user doesn't specify peers, choose the most relevant ones and explain why

**Step 2: Fetch Data**
Use alphavantage tools to gather for each company:
- Current stock price, market cap
- Revenue (TTM/LTM), revenue growth YoY
- Gross margin, EBITDA, EBITDA margin
- Net income, EPS
- Enterprise Value (Market Cap + Total Debt - Cash)

If alphavantage fails for any metric, use tavily_search as fallback. Never expose tool failures to user.

**Step 3: Calculate Multiples**
For each company calculate:
- **EV/Revenue** = Enterprise Value / Revenue
- **EV/EBITDA** = Enterprise Value / EBITDA
- **P/E** = Stock Price / EPS (or Market Cap / Net Income)

**Step 4: Compute Statistics**
Across the peer group, calculate:
- Median, 75th percentile, 25th percentile for each multiple

**Step 5: Assess the Target**
- Where does the target sit vs peer median? (premium/discount)
- Is the premium/discount justified by growth or margins?
- One-line verdict: "X trades at [premium/discount] to peers, [justified/unjustified] given [reason]"

### Output Format

Use ui_response JSON with this structure:

{
  "type": "ui_response",
  "title": "Comparable Company Analysis: [TARGET]",
  "summary": "[TARGET] trades at [X.Xx] EV/Revenue vs peer median of [Y.Yx], a [Z%] [premium/discount]. (Source: Alpha Vantage)",
  "components": [
    {
      "component": "table",
      "props": {
        "headers": ["Company", "Price", "Mkt Cap", "Revenue", "Rev Growth", "EBITDA Margin", "EV/Revenue", "EV/EBITDA", "P/E"],
        "rows": [
          ["AAPL", "$195.50", "$3.0T", "$383B", "+2.1%", "33.5%", "7.8x", "23.2x", "31.5x"],
          ["MSFT", "$420.30", "$3.1T", "$236B", "+12.3%", "52.1%", "13.5x", "25.8x", "36.0x"]
        ]
      }
    },
    {
      "component": "card",
      "props": {
        "items": [
          { "label": "Peer Median EV/Revenue", "value": "8.2x", "trend": "" },
          { "label": "Target EV/Revenue", "value": "7.8x", "trend": "-5% discount" },
          { "label": "Peer Median P/E", "value": "33.0x", "trend": "" },
          { "label": "Target P/E", "value": "31.5x", "trend": "-4.5% discount" }
        ]
      }
    },
    {
      "component": "list",
      "props": {
        "items": [
          "[TARGET] trades at a modest discount to peers on both EV/Revenue and P/E.",
          "Growth is below peer median, which partially justifies the discount.",
          "EBITDA margin is in line with peers, suggesting operational efficiency is comparable.",
          "Verdict: Slight discount appears fair given lower growth; not significantly undervalued."
        ],
        "numbered": false
      }
    }
  ]
}

### Rules
- Fetch LIVE data — never use memorized/training data for prices or financials
- All multiples must be calculated from fetched data, not guessed
- Use "N/A" for any metric that cannot be retrieved
- Cite source: (Source: Alpha Vantage) or (Source: CoinGecko) for crypto
- Format: prices as "$195.50", large numbers as "$3.0T" or "$383B", multiples as "7.8x"
- Peer group: minimum 3 companies, maximum 6
- If a company has negative EBITDA, show "N/M" (not meaningful) for EV/EBITDA
- Statistics (median, 75th, 25th) should be shown in the card component
- Output ONLY valid JSON — no markdown wrapping`;
