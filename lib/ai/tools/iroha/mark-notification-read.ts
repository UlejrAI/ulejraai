import { tool } from "ai";
import { z } from "zod";
import { proxyIrohaRequestWithAuth } from "@/lib/api/iroha";
import { getAuthToken } from "@/lib/auth/session";
import { parseIrohaResponse } from "./utils";

export const markNotificationRead = tool({
  description: `Mark a notification as read.
    Use this when user wants to dismiss or mark a specific notification as read.`,
  inputSchema: z.object({
    notificationId: z
      .string()
      .describe("The unique identifier of the notification to mark as read"),
  }),
  execute: async ({ notificationId }) => {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: "Authentication required." };
    }

    try {
      const response = await proxyIrohaRequestWithAuth(
        token,
        `/org/notifications/${notificationId}`,
        { method: "PATCH", body: JSON.stringify({ read: true }) }
      );
      return parseIrohaResponse(response);
    } catch {
      return {
        success: false,
        error: `Failed to mark notification ${notificationId} as read.`,
      };
    }
  },
});
