import { NextResponse } from "next/server";
import { ChatSDKError } from "@/lib/errors";

export async function POST(request: Request) {
  try {
    const baseURL = process.env.EXTERNAL_BACKEND_URL;

    if (!baseURL) {
      throw new ChatSDKError(
        "bad_request:api",
        "EXTERNAL_BACKEND_URL is not configured."
      );
    }

    const payload = await request.text();
    const parsedPayload = JSON.parse(payload);

    const { token, orgId, full_name, phone, account_number } = parsedPayload;

    if (!token) {
      return new ChatSDKError(
        "bad_request:api",
        "Token is required for wallet creation."
      ).toResponse();
    }

    const walletUrl = `${baseURL}/organization/api/ledger/org/wallet/create`;
    const walletResponse = await fetch(walletUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orgId,
        full_name,
        phone,
        account_number,
      }),
    });

    if (!walletResponse.ok) {
      const errorData = await walletResponse.json().catch(() => ({}));
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: errorData.message || "Failed to create wallet",
        }),
        {
          status: walletResponse.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const walletData = await walletResponse.json();

    return new NextResponse(
      JSON.stringify({
        success: true,
        wallet: walletData,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    console.error("retry_wallet proxy error:", error);

    return new ChatSDKError(
      "offline:api",
      "Unable to reach the wallet service."
    ).toResponse();
  }
}
