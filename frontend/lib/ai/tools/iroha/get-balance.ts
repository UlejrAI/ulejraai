import { tool } from "ai";
import { z } from "zod";
import { proxyIrohaRequestWithAuth } from "@/lib/api/iroha";
import { getAuthToken } from "@/lib/auth/session";
import { parseIrohaResponse } from "./utils";

export const getBalance = tool({
  description: `Get the current wallet balance for a user account. 
    Returns available balance for all assets in the wallet.
    Use this when user asks about balance, holdings, funds, or how much money they have.`,
  inputSchema: z.object({
    accountId: z
      .string()
      .optional()
      .describe(
        "The account ID to check (uses default account if not provided)"
      ),
  }),
  execute: async ({ accountId }) => {
    const token = await getAuthToken();
    if (!token) {
      return {
        success: false,
        error: "Authentication required. Please log in to check your balance.",
      };
    }

    try {
      const endpoint = accountId
        ? `/org/wallet/balance/${accountId}`
        : "/org/wallet/balance/default";

      const response = await proxyIrohaRequestWithAuth(token, endpoint);
      return parseIrohaResponse(response);
    } catch {
      return {
        success: false,
        error: "Failed to fetch balance. Please try again later.",
      };
    }
  },
});
