export const generativeUiPrompt = `
## Generative UI Responses

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
- Use list for unordered items
`;
