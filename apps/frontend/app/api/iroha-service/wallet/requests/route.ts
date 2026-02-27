import { proxyIrohaRequestWithAuth } from "@/lib/api/iroha";
import { getAuthToken } from "@/lib/auth/session";

export async function GET(_request: Request) {
  const token = await getAuthToken();

  if (!token) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { searchParams } = new URL(_request.url);
  const accountId = searchParams.get("accountId");
  const endpoint = accountId
    ? `/org/wallet/requests?accountId=${accountId}`
    : "/org/wallet/requests";

  return proxyIrohaRequestWithAuth(token, endpoint);
}
