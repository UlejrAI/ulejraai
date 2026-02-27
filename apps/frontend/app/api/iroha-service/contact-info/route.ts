import { proxyIrohaRequestWithAuth } from "@/lib/api/iroha";
import { getAuthToken } from "@/lib/auth/session";

export async function PUT(request: Request) {
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

  const body = await request.json();

  return proxyIrohaRequestWithAuth(token, "/org/wallet/update", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}
