export function detectIrohaIntent(message: string): string[] {
  const lowerMessage = message.toLowerCase();

  const intentKeywords: Record<string, string[]> = {
    transferFunds: [
      "send",
      "transfer",
      "pay",
      "sendstablecoins",
      "paybills",
      "move funds",
      "wire",
      "send money",
      "transfer funds",
      "send to",
    ],
    exchangeAsset: [
      "convert",
      "exchange",
      "swap",
      "trade",
      "change currency",
      "convert to",
      "exchange for",
      "swap for",
    ],
    setBalance: [
      "set balance",
      "set my balance",
      "add tokens",
      "add balance",
      "request 100",
      "request tokens",
      "request leo",
      "request usd",
      "get tokens",
      "receive tokens",
      "claim tokens",
    ],
    getBalance: [
      "balance",
      "how much",
      "holdings",
      "funds",
      "money",
      "check balance",
      "my balance",
      "show balance",
      "what's my balance",
    ],
    getWalletInfo: [
      "wallet",
      "account",
      "portfolio",
      "assets",
      "my wallet",
      "all accounts",
      "wallet info",
    ],
    getNotifications: [
      "notification",
      "notifications",
      "alert",
      "alerts",
      "message",
      "messages",
      "unread",
      "recent notifications",
    ],
    getTransferRequests: [
      "request",
      "requests",
      "pending transfer",
      "transfer request",
      "incoming request",
      "outgoing request",
    ],
    getRequestDetails: [
      "request details",
      "request status",
      "request #",
      "transaction id",
    ],
    getUserInfo: ["user info", "profile", "account info", "my profile"],
    getContactInfo: [
      "contact",
      "contact info",
      "phone",
      "email",
      "address",
      "my details",
    ],
    updateContactInfo: [
      "update contact",
      "change phone",
      "change email",
      "change address",
      "update my info",
    ],
    markNotificationRead: [
      "mark as read",
      "dismiss notification",
      "mark read",
      "clear notification",
    ],
    getCompanies: [
      "companies",
      "partners",
      "organizations",
      "business",
      "connected",
    ],
    createInvoice: [
      "invoice",
      "invoicing",
      "billing",
      "bill for",
      "charge for",
      "payment request",
      "generate invoice",
      "create invoice",
      "send invoice",
      "make invoice",
    ],
  };

  const detectedIntents: string[] = [];

  for (const [tool, keywords] of Object.entries(intentKeywords)) {
    if (keywords.some((kw) => lowerMessage.includes(kw))) {
      detectedIntents.push(tool);
    }
  }

  return detectedIntents;
}
