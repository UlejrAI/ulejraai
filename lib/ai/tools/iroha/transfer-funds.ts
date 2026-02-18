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

export const transferFunds = tool({
  description: `Transfer funds or assets from the authenticated user's account to another account.
    Use this when user wants to send, transfer, or pay someone.
    REQUIRES USER APPROVAL before executing - always confirm the transfer details with the user first.
    
    Asset ID mapping:
    - "leo" or "LEO" → "leo#saloneledger"
    - "usd" or "USD" → "usd#saloneledger"
    
    IMPORTANT: Always explain what will happen and ask for confirmation before proceeding.
    After approval, the transfer will be executed and return a transaction ID.`,
  inputSchema: z.object({
    toAccountId: z
      .string()
      .describe("Recipient's account ID (email or wallet address)"),
    assetId: z
      .string()
      .describe(
        "Asset to transfer. Use mapped values: 'leo' → 'leo#saloneledger', 'usd' → 'usd#saloneledger'. " +
          "If user says 'send 100 USDC', use 'usd#saloneledger'. If user says 'send 50 LEO', use 'leo#saloneledger'."
      ),
    amount: z
      .number()
      .positive()
      .describe("Amount to transfer (must be greater than 0)"),
    description: z
      .string()
      .optional()
      .describe("Optional note or description for the transfer"),
  }),
  needsApproval: true,
  execute: async ({ toAccountId, assetId, amount, description }) => {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: "Authentication required." };
    }

    if (amount <= 0) {
      return {
        success: false,
        error: "Transfer amount must be greater than 0.",
      };
    }

    const mappedAssetId = mapAssetId(assetId);

    try {
      const response = await proxyIrohaRequestWithAuth(
        token,
        "/org/wallet/transfer",
        {
          method: "POST",
          body: JSON.stringify({
            toAccountId,
            assetId: mappedAssetId,
            amount,
            description,
          }),
        }
      );
      return parseIrohaResponse(response);
    } catch {
      return {
        success: false,
        error: "Failed to execute transfer. Please try again.",
      };
    }
  },
});
