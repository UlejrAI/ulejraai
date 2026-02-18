import { tool } from "ai";
import { z } from "zod";
import { proxyIrohaRequestWithAuth } from "@/lib/api/iroha";
import { getAuthToken } from "@/lib/auth/session";
import { parseIrohaResponse } from "./utils";

export const exchangeAsset = tool({
  description: `Exchange one asset for another (e.g., USD to EUR).
    Use this when user wants to convert, exchange, swap, or trade one currency for another.
    REQUIRES USER APPROVAL before executing - always confirm the exchange rate and details with the user first.
    
    IMPORTANT: Always explain the exchange rate and any fees before proceeding.`,
  inputSchema: z.object({
    fromAssetId: z.string().describe("Source asset ID (e.g., 'usd#ulejra')"),
    toAssetId: z.string().describe("Target asset ID (e.g., 'eur#ulejra')"),
    amount: z
      .number()
      .positive()
      .describe("Amount of source asset to exchange"),
  }),
  needsApproval: true,
  execute: async ({ fromAssetId, toAssetId, amount }) => {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: "Authentication required." };
    }

    if (amount <= 0) {
      return {
        success: false,
        error: "Exchange amount must be greater than 0.",
      };
    }

    if (fromAssetId === toAssetId) {
      return { success: false, error: "Cannot exchange an asset for itself." };
    }

    try {
      const response = await proxyIrohaRequestWithAuth(
        token,
        "/org/wallet/exchange",
        {
          method: "POST",
          body: JSON.stringify({
            fromAssetId,
            toAssetId,
            amount,
          }),
        }
      );
      return parseIrohaResponse(response);
    } catch {
      return {
        success: false,
        error: "Failed to execute exchange. Please try again.",
      };
    }
  },
});
