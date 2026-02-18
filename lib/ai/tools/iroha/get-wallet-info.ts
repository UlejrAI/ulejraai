import { tool } from "ai";
import { z } from "zod";
import { proxyIrohaRequestWithAuth } from "@/lib/api/iroha";
import { getAuthToken } from "@/lib/auth/session";
import { parseIrohaResponse } from "./utils";

export const getWalletInfo = tool({
  description: `Get comprehensive wallet information including all accounts, assets, and transaction history.
    Use this when user asks about their wallet, portfolio, accounts, or complete financial overview.`,
  inputSchema: z.object({}),
  execute: async () => {
    const token = await getAuthToken();
    if (!token) {
      return {
        success: false,
        error: "Authentication required. Please log in to view your wallet.",
      };
    }

    try {
      const response = await proxyIrohaRequestWithAuth(
        token,
        "/org/wallet/getAll-user-wallet"
      );
      return parseIrohaResponse(response);
    } catch {
      return {
        success: false,
        error: "Failed to fetch wallet information. Please try again later.",
      };
    }
  },
});
