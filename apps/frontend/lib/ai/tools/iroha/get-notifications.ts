import { tool } from "ai";
import { z } from "zod";
import { proxyIrohaRequestWithAuth } from "@/lib/api/iroha";
import { getAuthToken } from "@/lib/auth/session";
import { parseIrohaResponse } from "./utils";

export const getNotifications = tool({
  description: `Get a list of notifications for the authenticated user.
    Returns all notifications including alerts, updates, and messages.
    Use this when user asks about notifications, alerts, or messages.`,
  inputSchema: z.object({
    limit: z
      .number()
      .optional()
      .describe("Maximum number of notifications to return (default: 20)"),
    unreadOnly: z
      .boolean()
      .optional()
      .describe("If true, only return unread notifications"),
  }),
  execute: async ({ limit, unreadOnly }) => {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: "Authentication required." };
    }

    try {
      const params = new URLSearchParams();
      if (limit) {
        params.set("limit", String(limit));
      }
      if (unreadOnly) {
        params.set("unreadOnly", "true");
      }

      const queryString = params.toString();
      const endpoint = `/org/notifications${queryString ? `?${queryString}` : ""}`;

      const response = await proxyIrohaRequestWithAuth(token, endpoint);
      return parseIrohaResponse(response);
    } catch {
      return { success: false, error: "Failed to fetch notifications." };
    }
  },
});
