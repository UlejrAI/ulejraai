import { tool } from "ai";
import { z } from "zod";
import { proxyIrohaRequestWithAuth } from "@/lib/api/iroha";
import { getAuthToken } from "@/lib/auth/session";
import { parseIrohaResponse } from "./utils";

export const getRequestDetails = tool({
  description: `Get detailed information about a specific transfer request.
    Use this when user asks about a specific request ID or wants details about a pending/completed transfer.`,
  inputSchema: z.object({
    requestId: z
      .string()
      .describe("The unique identifier of the transfer request"),
  }),
  execute: async ({ requestId }) => {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: "Authentication required." };
    }

    try {
      const response = await proxyIrohaRequestWithAuth(
        token,
        `/org/wallet/requests/${requestId}`
      );
      return parseIrohaResponse(response);
    } catch {
      return {
        success: false,
        error: `Failed to fetch details for request ${requestId}.`,
      };
    }
  },
});
