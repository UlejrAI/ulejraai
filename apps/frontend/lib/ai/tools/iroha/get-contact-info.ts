import { tool } from "ai";
import { z } from "zod";
import { proxyIrohaRequestWithAuth } from "@/lib/api/iroha";
import { getAuthToken } from "@/lib/auth/session";
import { parseIrohaResponse } from "./utils";

export const getContactInfo = tool({
  description: `Get the authenticated user's contact information.
    Returns saved contact details including phone, address, and communication preferences.
    Use this when user asks about their contact info or saved details.`,
  inputSchema: z.object({}),
  execute: async () => {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: "Authentication required." };
    }

    try {
      const response = await proxyIrohaRequestWithAuth(
        token,
        "/org/contact-info"
      );
      return parseIrohaResponse(response);
    } catch {
      return { success: false, error: "Failed to fetch contact information." };
    }
  },
});
