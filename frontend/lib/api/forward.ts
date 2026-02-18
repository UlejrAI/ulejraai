import { EXTERNAL_BACKEND_URL } from "@/lib/constants";
import { ChatSDKError } from "@/lib/errors";

export function resolveExternalBackendUrl(path: string) {
  if (!EXTERNAL_BACKEND_URL) {
    throw new ChatSDKError(
      "bad_request:api",
      "EXTERNAL_BACKEND_URL is not configured."
    );
  }

  return new URL(path, EXTERNAL_BACKEND_URL).toString();
}

export function buildForwardHeaders(request: Request, authToken?: string) {
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");

  if (!headers.has("accept")) {
    headers.set("accept", "application/json");
  }

  if (request.method !== "GET" && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  return headers;
}

export function createResponseFromBackend(response: Response) {
  const headers = new Headers(response.headers);
  headers.delete("content-encoding");
  headers.delete("transfer-encoding");

  return new Response(response.body, {
    status: response.status,
    headers,
  });
}
