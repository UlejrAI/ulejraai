export const dcfValuationContent = `## DCF Valuation Skill

Build a Discounted Cash Flow valuation model for a company using live financial data.

### When to Use
- User asks "what is X worth?", "fair value of X", "intrinsic value"
- User mentions "DCF", "discounted cash flow", "valuation model"
- User asks "is X overvalued/undervalued?" (use alongside comps-analysis)

### Workflow

**Step 1: Gather Company Data**
- Use fmp_get_company_profile → sector, market cap, beta, description
- Use fmp_get_income_statement (period: "annual", limit: 3) → revenue trend, net income, depreciation, capex
- Use fmp_get_quote → current price, shares outstanding

**Step 2: Determine Assumptions**
From the fetched data, derive:
- **Free Cash Flow**: Net Income + Depreciation - CapEx (or use operating cash flow if available)
- **Growth rate**: Based on 3-year revenue CAGR, adjusted for sector outlook
- **Terminal growth rate**: Default 2.5% (adjust: 2% for mature, 3% for high-growth sectors)
- **Discount rate (WACC)**: Default 10% (adjust using beta: higher beta → higher WACC)
- **Shares outstanding, total debt, cash**: From income statement and profile

State each assumption clearly with one-line justification.

**Step 3: Run DCF**
Use fmp_calculate_dcf with:
- symbol
- free_cash_flow (calculated in Step 2)
- shares_outstanding
- total_debt
- cash_and_equivalents
- growth_rate
- terminal_growth_rate
- discount_rate
- projection_years: 5

**Step 4: Sensitivity Analysis**
Run fmp_calculate_dcf 8 additional times (or calculate manually) to build a 3x3 grid:
- Growth rates: base-2%, base, base+2%
- Discount rates: base-1%, base, base+1%

**Step 5: Cross-Check & Verdict**
- Compare DCF implied price vs current market price → upside/downside %
- Compare implied EV/EBITDA to sector average (mention comps-analysis if useful)
- Check terminal value % of total EV (should be 50-75%; flag if outside)
- One-line verdict: "[Company] appears [undervalued/overvalued/fairly valued] by [X%] based on DCF."

### Output Format

{
  "type": "ui_response",
  "title": "DCF Valuation: [COMPANY]",
  "summary": "[COMPANY] implied fair value is $X.XX vs current price $Y.YY ([Z%] [upside/downside]). (Source: FMP)",
  "components": [
    {
      "component": "card",
      "props": {
        "items": [
          { "label": "Implied Share Price", "value": "$185.40" },
          { "label": "Current Price", "value": "$195.50", "trend": "+5.4% premium" },
          { "label": "Enterprise Value", "value": "$2.85T" },
          { "label": "Terminal Value % of EV", "value": "68.2%" }
        ]
      }
    },
    {
      "component": "table",
      "props": {
        "headers": ["Growth \\\\ WACC", "9%", "10%", "11%"],
        "rows": [
          ["3%", "$210", "$195", "$182"],
          ["5%", "$235", "$215", "$198"],
          ["7%", "$268", "$241", "$218"]
        ]
      }
    },
    {
      "component": "list",
      "props": {
        "items": [
          "Assumptions: 5% FCF growth (3-year revenue CAGR: 5.2%), 10% WACC (beta: 1.2), 2.5% terminal growth.",
          "Terminal value is 68% of total EV — within acceptable 50-75% range.",
          "At current price, the market implies ~6.5% growth, slightly above our base case.",
          "Verdict: Shares appear modestly overvalued (~5%) under base-case assumptions."
        ],
        "numbered": false
      }
    }
  ]
}

### Rules
- ALWAYS fetch live data from FMP before building the model — never guess financials
- Show your assumptions clearly — never present DCF without explaining inputs
- Sensitivity table: minimum 3x3 grid (growth rate vs discount rate)
- Terminal value should be 50-75% of EV; explicitly flag if outside this range
- Compare to market price and state upside/downside percentage
- If FCF is negative, warn the user that DCF may not be appropriate and suggest comps-analysis instead
- projection_years should default to 5 unless user specifies otherwise
- Cite source: (Source: FMP) for all financial data
- Output ONLY valid JSON — no markdown wrapping`;
