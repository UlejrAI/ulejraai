import { proxyIrohaRequestWithAuth } from "@/lib/api/iroha";
import { getAuthToken } from "@/lib/auth/session";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

  const { id } = await params;
  const body = await request.json();

  return proxyIrohaRequestWithAuth(token, `/org/notifications/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
