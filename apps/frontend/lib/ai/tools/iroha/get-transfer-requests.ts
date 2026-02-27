import { tool } from "ai";
import { z } from "zod";
import { proxyIrohaRequestWithAuth } from "@/lib/api/iroha";
import { getAuthToken } from "@/lib/auth/session";
import { parseIrohaResponse } from "./utils";

export const getTransferRequests = tool({
  description: `Get a list of transfer requests for the authenticated user.
    Returns pending and completed transfer requests.
    Use this when user asks about transfer requests, pending transfers, or outgoing/incoming requests.`,
  inputSchema: z.object({
    status: z
      .enum(["pending", "completed", "rejected", "all"])
      .optional()
      .describe("Filter by request status"),
    limit: z
      .number()
      .optional()
      .describe("Maximum number of requests to return"),
  }),
  execute: async ({ status, limit }) => {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: "Authentication required." };
    }

    try {
      const params = new URLSearchParams();
      if (status) {
        params.set("status", status);
      }
      if (limit) {
        params.set("limit", String(limit));
      }

      const queryString = params.toString();
      const endpoint = `/org/wallet/requests${queryString ? `?${queryString}` : ""}`;

      const response = await proxyIrohaRequestWithAuth(token, endpoint);
      return parseIrohaResponse(response);
    } catch {
      return { success: false, error: "Failed to fetch transfer requests." };
    }
  },
});

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
