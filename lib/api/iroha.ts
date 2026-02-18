import { EXTERNAL_BACKEND_URL } from "@/lib/constants";

const IROHA_BASE_URL = `${EXTERNAL_BACKEND_URL}/organization/api/ledger`;

export async function proxyIrohaRequest(
  endpoint: string,
  options: RequestInit = {}
) {
  const url = `${IROHA_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
    },
  });

  const data = await response.json();

  if (response.ok) {
    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: false, error: data }), {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function proxyIrohaRequestWithAuth(
  token: string,
  endpoint: string,
  options: RequestInit = {}
) {
  const url = `${IROHA_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json();

  if (response.ok) {
    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: false, error: data }), {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}
