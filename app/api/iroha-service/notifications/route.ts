import { proxyIrohaRequestWithAuth } from "@/lib/api/iroha";
import { getAuthToken } from "@/lib/auth/session";

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("account_id");
  const status = searchParams.get("status");

  if (!accountId) {
    return new Response(
      JSON.stringify({ success: false, error: "account_id is required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  let endpoint = `/org/notifications?account_id=${accountId}`;
  if (status) {
    endpoint += `&status=${status}`;
  }

  return proxyIrohaRequestWithAuth(token, endpoint);
}

export async function POST(request: Request) {
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

  return proxyIrohaRequestWithAuth(token, "/org/notifications", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
