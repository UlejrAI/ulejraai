import { tool } from "ai";
import { z } from "zod";
import { proxyIrohaRequestWithAuth } from "@/lib/api/iroha";
import { getAuthToken } from "@/lib/auth/session";
import { parseIrohaResponse } from "./utils";

const contactInfoSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z
    .object({
      street: z.string(),
      city: z.string(),
      country: z.string(),
      postalCode: z.string(),
    })
    .optional(),
});

export const updateContactInfo = tool({
  description: `Update the authenticated user's contact information.
    Use this when user wants to change their email, phone, or address.
    REQUIRES USER APPROVAL before executing.`,
  inputSchema: z.object({
    email: z.string().email().optional().describe("New email address"),
    phone: z.string().optional().describe("New phone number"),
    address: z
      .object({
        street: z.string().describe("Street address"),
        city: z.string().describe("City"),
        country: z.string().describe("Country"),
        postalCode: z.string().describe("Postal/zip code"),
      })
      .optional()
      .describe("New address"),
  }),
  needsApproval: true,
  execute: async (input) => {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: "Authentication required." };
    }

    const validation = contactInfoSchema.safeParse(input);
    if (!validation.success) {
      return { success: false, error: "Invalid contact information format." };
    }

    try {
      const response = await proxyIrohaRequestWithAuth(
        token,
        "/org/contact-info",
        { method: "POST", body: JSON.stringify(input) }
      );
      return parseIrohaResponse(response);
    } catch {
      return { success: false, error: "Failed to update contact information." };
    }
  },
});
