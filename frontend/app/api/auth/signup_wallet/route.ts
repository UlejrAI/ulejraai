import {
  buildForwardHeaders,
  createResponseFromBackend,
} from "@/lib/api/forward";
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

    const backendUrl = `${baseURL}/auth/api/auth/signup_wallet`;
    const payload = await request.text();

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: buildForwardHeaders(request),
      body: payload,
    });

    const responseClone = response.clone();

    try {
      const responseData = await response.json();

      if (response.ok && responseData.token) {
        const { token, data } = responseData;
        const parsedPayload = JSON.parse(payload);

        let walletData = null;
        let walletError = null;

        try {
          const walletUrl = `${baseURL}/organization/api/ledger/org/wallet/create`;
          const walletResponse = await fetch(walletUrl, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              orgId: parsedPayload.company_name,
              full_name: parsedPayload.full_name,
              phone: Number(parsedPayload.phone) || 0,
              account_number: parsedPayload.account_number,
            }),
          });

          if (walletResponse.ok) {
            walletData = await walletResponse.json();
          } else {
            walletError = "Wallet creation pending - please retry";
          }
        } catch (walletError_) {
          walletError =
            walletError_ instanceof Error
              ? walletError_.message
              : "Wallet creation failed";
        }

        return new Response(
          JSON.stringify({
            success: true,
            token,
            user: {
              id: data.user_id,
            },
            wallet: walletData,
            walletError,
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      return createResponseFromBackend(responseClone);
    } catch {
      return createResponseFromBackend(responseClone);
    }
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    console.error("signup_wallet proxy error:", error);

    return new ChatSDKError(
      "offline:api",
      "Unable to reach the signup wallet service."
    ).toResponse();
  }
}
