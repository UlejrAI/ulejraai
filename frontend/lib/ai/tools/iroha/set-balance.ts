import { tool } from "ai";
import { z } from "zod";
import { proxyIrohaRequestWithAuth } from "@/lib/api/iroha";
import { getAuthToken } from "@/lib/auth/session";
import { parseIrohaResponse } from "./utils";

const ASSET_ID_MAP: Record<string, string> = {
  leo: "leo#saloneledger",
  usd: "usd#saloneledger",
  euro: "eur#saloneledger",
};

function mapAssetId(input: string): string {
  const normalized = input.toLowerCase().trim();
  return ASSET_ID_MAP[normalized] || input;
}

export const setBalance = tool({
  description: `Set or update the balance for a user account (admin/organization operation).
    Use this when user wants to set, add, or update tokens/asset balance for themselves or another user.
    REQUIRES USER APPROVAL before executing.
    
    Asset ID mapping:
    - "leo" or "LEO" → "leo#saloneledger"
    - "usd" or "USD" → "usd#saloneledger"
    
    IMPORTANT: This requires appropriate permissions. Always confirm with the user first.`,
  inputSchema: z.object({
    userAccountId: z
      .string()
      .describe("The user account ID to set balance for (from wallet info)"),
    assetId: z
      .string()
      .describe(
        "Asset ID. Use mapped values: 'leo' → 'leo#saloneledger', 'usd' → 'usd#saloneledger'. " +
          "If user says '100 leo', use 'leo#saloneledger'. If user says '50 usd', use 'usd#saloneledger'."
      ),
    amount: z.number().describe("Amount to set (positive number)"),
  }),
  needsApproval: true,
  execute: async ({ userAccountId, assetId, amount }) => {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: "Authentication required." };
    }

    if (amount < 0) {
      return { success: false, error: "Amount cannot be negative." };
    }

    const mappedAssetId = mapAssetId(assetId);

    try {
      const response = await proxyIrohaRequestWithAuth(
        token,
        "/org/wallet/set-balance",
        {
          method: "POST",
          body: JSON.stringify({
            userAccountId,
            assetId: mappedAssetId,
            amount,
          }),
        }
      );
      return parseIrohaResponse(response);
    } catch {
      return {
        success: false,
        error: "Failed to set balance. Please try again.",
      };
    }
  },
});
