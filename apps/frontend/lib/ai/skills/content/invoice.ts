export const invoiceContent = `## Invoice Generation

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
- If the user specifies a fiat amount with crypto payment, calculate the crypto amount using the fetched rate`;
