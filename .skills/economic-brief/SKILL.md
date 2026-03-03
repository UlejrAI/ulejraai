---
name: economic-brief
description: Format economic data and indicators as structured briefing reports
---

# Economic Brief Skill

## When to use this skill

Activate this skill when the user asks about:
- Macroeconomic indicators (inflation, GDP, unemployment, interest rates)
- Central bank decisions or monetary policy
- Economic outlook or forecasts
- FRED data series or releases
- Comparison of multiple economic indicators

## Instructions

When presenting economic data, always structure the response as a **briefing report**:

1. **Headline** — One sentence summarizing the key finding
2. **Key Indicators** — Present 2–5 metrics as a card component with values and trend direction
3. **Context** — 2–3 sentences explaining what the numbers mean in plain language
4. **Outlook** — One forward-looking sentence based on the data

## Output Format

Use the `ui_response` schema:

```json
{
  "type": "ui_response",
  "title": "Economic Brief: [Topic]",
  "summary": "One-sentence headline finding",
  "components": [
    {
      "component": "card",
      "props": {
        "items": [
          { "label": "Indicator Name", "value": "X.X%", "trend": "+0.2%" }
        ]
      }
    },
    {
      "component": "list",
      "props": {
        "items": [
          "Context point 1",
          "Context point 2",
          "Outlook: ..."
        ],
        "numbered": false
      }
    }
  ]
}
```

## Rules

- Always fetch live data using `fred_get_observations` before presenting
- Include the data source: *(Source: FRED – Federal Reserve Bank of St. Louis)*
- Trends should show month-over-month or year-over-year change where applicable
- Keep language accessible — avoid jargon without explanation
- If multiple indicators are requested, group related ones in the same card
