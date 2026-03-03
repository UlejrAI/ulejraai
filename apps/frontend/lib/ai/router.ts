/**
 * LLMRouter client — routes queries via external microservice.
 *
 * The microservice uses an LLM to classify query complexity,
 * then returns the appropriate model ID.
 *
 * Architecture:
 *   Query → LLMRouter microservice (LLM classification + cache)
 *         → returns { model_id, routed_to }
 *
 *   Auth (priority order):
 *   1. LLMROUTER_API_KEY env var → sent as Bearer token (local dev & CI)
 *   2. GCP metadata server → identity token (Cloud Run → Cloud Run)
 *   3. No auth (localhost without key)
 *
 *   If microservice is down → defaults to strong model (safe fallback)
 */

export const STRONG_MODEL = "kimi-k2.5";
export const WEAK_MODEL = "kimi-k2-turbo-preview";
export const AUTO_ROUTER_MODEL = "auto";

const LLMROUTER_URL = process.env.LLMROUTER_URL || "http://localhost:8001";
const LLMROUTER_API_KEY = process.env.LLMROUTER_API_KEY || "";
const ROUTE_TIMEOUT_MS = 8000;

// ---------------------------------------------------------------------------
// GCP identity token cache (tokens are valid for ~1 hour, refresh at 55 min)
// ---------------------------------------------------------------------------

let _cachedToken: string | null = null;
let _tokenExpiry = 0;
const TOKEN_TTL_MS = 55 * 60 * 1000; // 55 minutes

async function getAuthToken(): Promise<string | null> {
  // 1. Static API key (local dev / CI) — never expires
  if (LLMROUTER_API_KEY) {
    return LLMROUTER_API_KEY;
  }

  // 2. Skip GCP metadata when running locally without a key
  if (LLMROUTER_URL.startsWith("http://localhost")) {
    return null;
  }

  const now = Date.now();
  if (_cachedToken && now < _tokenExpiry) {
    return _cachedToken;
  }

  try {
    // Extract base URL as the audience (e.g. https://llmrouter-xxx.run.app)
    const audience = new URL(LLMROUTER_URL).origin;
    const metadataUrl = `http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity?audience=${audience}`;

    const res = await fetch(metadataUrl, {
      headers: { "Metadata-Flavor": "Google" },
      signal: AbortSignal.timeout(2000),
    });

    if (!res.ok) return null;

    _cachedToken = await res.text();
    _tokenExpiry = now + TOKEN_TTL_MS;
    return _cachedToken;
  } catch {
    // Not running on GCP or metadata server unreachable
    return null;
  }
}

// ---------------------------------------------------------------------------

export type RouteResult = {
  modelId: string;
  routedTo: "strong" | "weak";
  source: "llmrouter" | "fallback";
};

export async function routeModel(prompt: string): Promise<RouteResult> {
  // Empty or very short prompts → weak model, no need to call the service
  if (!prompt || prompt.trim().length < 10) {
    return {
      modelId: WEAK_MODEL,
      routedTo: "weak",
      source: "fallback",
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ROUTE_TIMEOUT_MS);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const token = await getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${LLMROUTER_URL}/route`, {
      method: "POST",
      headers,
      body: JSON.stringify({ query: prompt }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Router responded ${res.status}`);
    }

    const data = await res.json();

    return {
      modelId: data.model_id,
      routedTo: data.routed_to,
      source: "llmrouter",
    };
  } catch {
    // Service down, timeout, 403, error → safe fallback to strong model
    // (strong is safer than weak — user gets good quality even if routing fails)
    return {
      modelId: STRONG_MODEL,
      routedTo: "strong",
      source: "fallback",
    };
  }
}
