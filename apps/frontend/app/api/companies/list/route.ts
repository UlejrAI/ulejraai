import {
  buildForwardHeaders,
  createResponseFromBackend,
} from "@/lib/api/forward";
import { ChatSDKError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const baseURL = process.env.EXTERNAL_BACKEND_URL;
  try {
    const backendUrl = `${baseURL}/auth/global/companies/list`;

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: buildForwardHeaders(request),
    });

    return createResponseFromBackend(response);
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    console.error("companies list proxy error:", error);

    return new ChatSDKError(
      "offline:api",
      "Unable to reach the companies list service."
    ).toResponse();
  }
}
