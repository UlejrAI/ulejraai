export const economicBriefContent = `## Economic Brief Skill

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
- Output ONLY valid JSON — no markdown wrapping`;
