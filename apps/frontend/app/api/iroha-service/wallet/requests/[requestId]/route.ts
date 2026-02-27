import { proxyIrohaRequestWithAuth } from "@/lib/api/iroha";
import { getAuthToken } from "@/lib/auth/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
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

  const { requestId } = await params;

  return proxyIrohaRequestWithAuth(token, `/org/wallet/requests/${requestId}`);
}
