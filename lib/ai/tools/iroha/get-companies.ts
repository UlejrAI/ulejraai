import { tool } from "ai";
import { z } from "zod";
import { proxyIrohaRequestWithAuth } from "@/lib/api/iroha";
import { getAuthToken } from "@/lib/auth/session";
import { parseIrohaResponse } from "./utils";

export const getCompanies = tool({
  description: `Get a list of companies or organizations associated with the authenticated user.
    Returns companies, partners, or organizations the user is connected to.
    Use this when user asks about companies, partners, organizations, or business connections.`,
  inputSchema: z.object({}),
  execute: async () => {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: "Authentication required." };
    }

    try {
      const response = await proxyIrohaRequestWithAuth(
        token,
        "/org/companies/list"
      );
      return parseIrohaResponse(response);
    } catch {
      return { success: false, error: "Failed to fetch companies list." };
    }
  },
});
