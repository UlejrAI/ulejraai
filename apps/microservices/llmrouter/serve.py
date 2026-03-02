"""
LLM-based query router microservice.

For each incoming query, asks a cheap LLM: "Is this query simple or complex?"
Based on the answer, routes to strong or weak model.

Inspired by LLMRouter's llmmultiroundrouter strategy.
"""

import json
import os
import time
from pathlib import Path

import httpx
import yaml
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel

app = FastAPI(title="LLMRouter", version="1.0.0")

# ---------------------------------------------------------------------------
# Optional API key auth (set LLMROUTER_API_KEY env var to enable)
# ---------------------------------------------------------------------------

LLMROUTER_API_KEY = os.environ.get("LLMROUTER_API_KEY", "")




def _verify_api_key(authorization: str | None = Header(None)) -> None:
    """If LLMROUTER_API_KEY is set, require Bearer <key> on every request."""
    if not LLMROUTER_API_KEY:
        return  # No key configured → allow all (Cloud Run IAM handles auth)
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    token = authorization.removeprefix("Bearer ").strip()
    if token != LLMROUTER_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")

# ---------------------------------------------------------------------------
# Load config
# ---------------------------------------------------------------------------

CONFIG_PATH = Path(__file__).parent / "config.yaml"
CANDIDATES_PATH = Path(__file__).parent / "llm_candidates.json"

with open(CONFIG_PATH) as f:
    config = yaml.safe_load(f)

with open(CANDIDATES_PATH) as f:
    candidates = json.load(f)

ROUTER_MODEL = config["router"]["model"]
API_BASE = config["router"]["api_base"]
API_KEY = os.environ.get("MOONSHOT_API_KEY", "")
MAX_TOKENS = config["router"]["max_tokens"]
TEMPERATURE = config["router"]["temperature"]
CACHE_TTL = config["router"].get("cache_ttl", 300)

# ---------------------------------------------------------------------------
# Routing prompt
# ---------------------------------------------------------------------------

ROUTING_SYSTEM_PROMPT = f"""You are a query complexity classifier for a financial AI assistant.

Given a user query, respond with ONLY one word: "strong" or "weak".

Route to "strong" when the query requires:
- Multi-step analysis or reasoning
- Comparisons between multiple entities
- Forecasting, predictions, or projections
- Detailed reports or comprehensive explanations
- Technical/fundamental analysis
- Complex financial calculations (DCF, Sharpe ratio, etc.)
- Code generation

Route to "weak" when the query is:
- A simple greeting or thank you
- A direct price/balance lookup
- A straightforward transaction request
- A yes/no question
- A single-fact lookup
- Brief, simple questions with obvious answers

Available models:
- "strong": {candidates["strong"]["description"]}
- "weak": {candidates["weak"]["description"]}

Respond with ONLY "strong" or "weak". Nothing else."""

# ---------------------------------------------------------------------------
# Simple in-memory cache
# ---------------------------------------------------------------------------

_cache: dict[str, tuple[str, float]] = {}
MAX_CACHE_SIZE = 1000


def _get_cached(query: str) -> str | None:
    normalized = query.strip().lower()
    if normalized in _cache:
        result, timestamp = _cache[normalized]
        if time.time() - timestamp < CACHE_TTL:
            return result
        del _cache[normalized]
    return None


def _set_cache(query: str, result: str) -> None:
    normalized = query.strip().lower()
    if len(_cache) >= MAX_CACHE_SIZE:
        # Evict oldest entries
        oldest_keys = sorted(_cache, key=lambda k: _cache[k][1])[: MAX_CACHE_SIZE // 4]
        for k in oldest_keys:
            del _cache[k]
    _cache[normalized] = (result, time.time())


# ---------------------------------------------------------------------------
# LLM-based routing
# ---------------------------------------------------------------------------

http_client = httpx.AsyncClient(timeout=5.0)


async def classify_query(query: str) -> str:
    """Ask the router LLM whether this query is 'strong' or 'weak'."""

    # Check cache first
    cached = _get_cached(query)
    if cached:
        return cached

    try:
        response = await http_client.post(
            f"{API_BASE}/chat/completions",
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": ROUTER_MODEL,
                "messages": [
                    {"role": "system", "content": ROUTING_SYSTEM_PROMPT},
                    {"role": "user", "content": query},
                ],
                "max_tokens": MAX_TOKENS,
                "temperature": TEMPERATURE,
            },
        )

        response.raise_for_status()
        data = response.json()

        answer = data["choices"][0]["message"]["content"].strip().lower()
        # DEBUG: LLM'in ham cevabını logla
        print(f"[Router] Query: {query[:80]}")
        print(f"[Router] Raw LLM answer: '{answer}'")
        print(f"[Router] Decision: {'strong' if 'strong' in answer else 'weak'}")
        # Parse: accept "strong" or "weak", default to "weak" if unclear
        if "strong" in answer:
            result = "strong"
        else:
            result = "weak"

        _set_cache(query, result)
        return result

    except Exception as e:
        import traceback

        traceback.print_exc()
        print(f"[Router] LLM classification failed: {e}")
        return "weak"


# ---------------------------------------------------------------------------
# API endpoints
# ---------------------------------------------------------------------------


class RouteRequest(BaseModel):
    query: str


class RouteResponse(BaseModel):
    model_id: str
    routed_to: str
    source: str


@app.post("/route", response_model=RouteResponse)
async def route_query(req: RouteRequest, authorization: str | None = Header(None)):
    _verify_api_key(authorization)
    routed_to = await classify_query(req.query)
    candidate = candidates[routed_to]

    return RouteResponse(
        model_id=candidate["model_id"],
        routed_to=routed_to,
        source="llm",
    )


@app.get("/health")
async def health():
    return {"status": "ok", "router_model": ROUTER_MODEL}


@app.get("/cache/stats")
async def cache_stats():
    return {"size": len(_cache), "max_size": MAX_CACHE_SIZE, "ttl": CACHE_TTL}


@app.delete("/cache")
async def clear_cache():
    _cache.clear()
    return {"status": "cleared"}
