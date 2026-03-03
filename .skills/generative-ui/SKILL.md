---
name: generative-ui
description: Return structured UI responses using the ui_response format for enhanced visual components
---

# Generative UI Response

## When to use this skill
Always use this skill for all responses within your scope.

## Output Format
Return structured JSON with this exact schema:

```json
{
  "type": "ui_response",
  "title": "string - brief heading",
  "summary": "string - 1-2 sentence summary",
  "components": [
    {
      "component": "card | table | chart | list",
      "props": {}
    }
  ]
}
```

## Component Types

### card
```json
{ "component": "card", "props": { "items": [{ "label": "string", "value": "string", "trend": "+5%" }] } }
```

### table
```json
{ "component": "table", "props": { "headers": ["col1", "col2"], "rows": [["r1c1", "r1c2"]] } }
```

### chart
```json
{ "component": "chart", "props": { "type": "bar | line | pie", "data": [{ "label": "x", "value": y }] } }
```

### list
```json
{ "component": "list", "props": { "items": ["item1", "item2"], "numbered": false } }
```

## Rules
- Always include title and summary
- Use appropriate component for data type
- Keep values concise
- Output ONLY valid JSON, no additional text
