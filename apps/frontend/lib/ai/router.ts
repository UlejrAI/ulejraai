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
 *   If microservice is down → defaults to strong model (safe fallback)
 */

export const STRONG_MODEL = "kimi-k2.5";
export const WEAK_MODEL = "kimi-k2-turbo-preview";
export const AUTO_ROUTER_MODEL = "auto";

const LLMROUTER_URL = process.env.LLMROUTER_URL || "http://localhost:8001";
const ROUTE_TIMEOUT_MS = 3000;

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

    const res = await fetch(`${LLMROUTER_URL}/route`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    // Service down, timeout, error → safe fallback to strong model
    // (strong is safer than weak — user gets good quality even if routing fails)
    return {
      modelId: STRONG_MODEL,
      routedTo: "strong",
      source: "fallback",
    };
  }
}
