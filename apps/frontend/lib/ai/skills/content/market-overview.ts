export const marketOverviewContent = `## Market Overview Skill

Provide a real-time snapshot of current market conditions across stocks, crypto, forex, and commodities.

### When to Use
- User asks "how are markets doing?", "market overview", "market summary"
- User asks "what's happening in markets today?"
- User asks about multiple asset classes at once
- User says "market update", "daily briefing", "market check"

### Workflow

**Step 1: Stock Market Indices**
- Use fmp_get_index_quote for ^GSPC (S&P 500)
- Use fmp_get_index_quote for ^DJI (Dow Jones)
- Use fmp_get_index_quote for ^IXIC (Nasdaq Composite)
- Use fmp_get_market_hours (exchange: "NASDAQ") to check if market is open/closed

**Step 2: Top Movers**
- Use fmp_get_biggest_gainers (limit: 3)
- Use fmp_get_biggest_losers (limit: 3)
- Use fmp_get_most_active (limit: 3)

**Step 3: Crypto**
- Use fmp_get_crypto_quote for BTCUSD
- Use fmp_get_crypto_quote for ETHUSD

**Step 4: Forex & Commodities**
- Use fmp_get_forex_quotes for EURUSD
- Use fmp_get_commodities_prices for gold and oil

**Step 5: Market Narrative**
- Use tavily_tavily_search: "stock market today" for the key driver/headline

### Output Format

{
  "type": "ui_response",
  "title": "Market Overview — [DATE]",
  "summary": "S&P 500 [up/down] [X%] at [level]. Bitcoin at $[X]. Gold at $[X]/oz. (Sources: FMP, Tavily)",
  "components": [
    {
      "component": "card",
      "props": {
        "items": [
          { "label": "S&P 500", "value": "5,245.30", "trend": "+0.8%" },
          { "label": "Nasdaq", "value": "16,420.50", "trend": "+1.2%" },
          { "label": "Dow Jones", "value": "39,150.20", "trend": "+0.4%" },
          { "label": "BTC", "value": "$67,500", "trend": "+2.1%" },
          { "label": "ETH", "value": "$3,420", "trend": "+1.8%" },
          { "label": "Gold", "value": "$2,340/oz", "trend": "-0.3%" },
          { "label": "EUR/USD", "value": "1.0845", "trend": "+0.1%" }
        ]
      }
    },
    {
      "component": "table",
      "props": {
        "headers": ["Top Gainers", "Change", "Top Losers", "Change"],
        "rows": [
          ["SMCI", "+12.3%", "MRNA", "-8.1%"],
          ["PLTR", "+8.7%", "BA", "-5.4%"],
          ["NVDA", "+5.2%", "PFE", "-3.8%"]
        ]
      }
    },
    {
      "component": "list",
      "props": {
        "items": [
          "Markets rallied on stronger-than-expected jobs data, with tech leading gains.",
          "Bitcoin broke above $67K as spot ETF inflows hit a weekly record.",
          "Gold dipped slightly as dollar strengthened on rate-hold expectations.",
          "Outlook: Fed meeting next week is the key catalyst; markets pricing 85% chance of hold."
        ],
        "numbered": false
      }
    }
  ]
}

### Rules
- Fetch ALL data live from FMP — never use stale or memorized prices
- Always include at minimum: S&P 500, Nasdaq, Dow, BTC, Gold, EUR/USD
- Gainers/losers: top 3 each with ticker and percentage change
- Context must reference TODAY's specific market driver (from Tavily search)
- Market hours: mention if market is currently open or closed
- Trends: use "+" prefix for gains, "-" for losses
- Cite sources: (Source: FMP) for all price data, (Source: Tavily) for news narrative
- Output ONLY valid JSON — no markdown wrapping`;
