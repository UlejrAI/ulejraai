export function getQuickActionIntent(actionId: string): string {
  const actionToIntent: Record<string, string> = {
    pay: "transferFunds",
    "pay-bills": "transferFunds",
    "send-stablecoins": "transferFunds",
    convert: "exchangeAsset",
    "exchange-integration": "exchangeAsset",
    deposit: "getWalletInfo",
    "manage-subscriptions": "getNotifications",
    "automate-invoices": "transferFunds",
    "stock-data": "getCompanies",
    "financial-data": "getCompanies",
    "financial-news": "getNotifications",
  };

  return actionToIntent[actionId] || "getWalletInfo";
}

export function getQuickActionContext(actionId: string): string {
  const intent = getQuickActionIntent(actionId);

  const contextTemplates: Record<string, string> = {
    transferFunds: "The user wants to perform a transfer or payment operation.",
    exchangeAsset:
      "The user wants to exchange or convert one asset for another.",
    getWalletInfo: "The user wants information about their wallet or accounts.",
    getNotifications: "The user wants to view or manage their notifications.",
    getCompanies: "The user wants information about companies or partners.",
  };

  return (
    contextTemplates[intent] || "The user is performing a wallet operation."
  );
}
