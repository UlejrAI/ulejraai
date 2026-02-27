import { tool } from "ai";
import { z } from "zod";
import { proxyIrohaRequestWithAuth } from "@/lib/api/iroha";
import { getAuthToken } from "@/lib/auth/session";
import { parseIrohaResponse } from "./utils";

export const createTransferRequest = tool({
  description: `Create a transfer request to request tokens or assets from an organization or user.
    Use this when user wants to request, ask for, or borrow tokens/assets from their organization.
    REQUIRES USER APPROVAL before executing.`,
  inputSchema: z.object({
    recipientAccountId: z
      .string()
      .describe("Account ID to request from (e.g., organization account)"),
    assetId: z
      .string()
      .describe("Asset ID to request (e.g., 'leo#ulejra', 'usd#ulejra')"),
    amount: z.number().positive().describe("Amount to request"),
    description: z.string().optional().describe("Reason for the request"),
  }),
  needsApproval: true,
  execute: async ({ recipientAccountId, assetId, amount, description }) => {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: "Authentication required." };
    }

    if (amount <= 0) {
      return { success: false, error: "Amount must be greater than 0." };
    }

    try {
      const response = await proxyIrohaRequestWithAuth(
        token,
        "/org/wallet/requests",
        {
          method: "POST",
          body: JSON.stringify({
            recipientAccountId,
            assetId,
            amount,
            description,
          }),
        }
      );
      return parseIrohaResponse(response);
    } catch {
      return { success: false, error: "Failed to create transfer request." };
    }
  },
});
