"""
Financial Modeling Prep MCP Server

Provides tools, resources, and prompts for interacting with
the Financial Modeling Prep API via the Model Context Protocol.
"""
import os
import sys
import argparse
import pathlib
from dotenv import load_dotenv

# Load environment variables
env_path = pathlib.Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

from mcp.server.fastmcp import FastMCP


# ---------------------------------------------------------------------------
# 1. Parse CLI args FIRST (we need stateless/json_response before creating mcp)
# ---------------------------------------------------------------------------
def parse_args():
    default_port = int(os.environ.get("PORT", 8000))
    parser = argparse.ArgumentParser(description="Run the FMP MCP Server")
    parser.add_argument("--sse", action="store_true", help="Run as SSE server")
    parser.add_argument("--streamable-http", action="store_true", help="Run as Streamable HTTP server")
    parser.add_argument("--stateless", action="store_true", help="Stateless mode (Streamable HTTP)")
    parser.add_argument("--json-response", action="store_true", help="JSON responses instead of SSE streams")
    parser.add_argument("--port", type=int, default=default_port, help=f"Port (default: {default_port})")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Host (default: 0.0.0.0)")
    return parser.parse_args()


args = parse_args()

if args.sse and args.streamable_http:
    print("Error: Cannot specify both --sse and --streamable-http")
    sys.exit(1)


# ---------------------------------------------------------------------------
# 2. Create ONE FastMCP instance with the correct config
# ---------------------------------------------------------------------------
def create_mcp(name: str, **extra_kwargs):
    """Create FastMCP with only supported kwargs for the installed version."""
    import inspect
    sig = inspect.signature(FastMCP.__init__)
    valid_params = set(sig.parameters.keys()) - {"self"}
    filtered = {k: v for k, v in extra_kwargs.items() if k in valid_params}
    return FastMCP(name, **filtered)


extra = {}
if args.streamable_http:
    extra["stateless_http"] = args.stateless
    extra["json_response"] = args.json_response

mcp = create_mcp(
    "FMP Financial Data",
    description="Financial data tools powered by FMP API",
    dependencies=["httpx"],
    **extra,
)

# ---------------------------------------------------------------------------
# 3. Register tools (ONCE)
# ---------------------------------------------------------------------------
from src.tools.company import get_company_profile, get_company_notes
from src.tools.statements import get_income_statement
from src.tools.search import search_by_symbol, search_by_name
from src.tools.quote import get_quote, get_quote_change, get_aftermarket_quote
from src.tools.charts import get_price_change
from src.tools.analyst import (
    get_ratings_snapshot, get_financial_estimates,
    get_price_target_news, get_price_target_latest_news,
)
from src.tools.calendar import get_company_dividends, get_dividends_calendar
from src.tools.indices import get_index_list, get_index_quote
from src.tools.market_performers import get_biggest_gainers, get_biggest_losers, get_most_active
from src.tools.market_hours import get_market_hours
from src.tools.commodities import get_commodities_list, get_commodities_prices, get_historical_price_eod_light
from src.tools.crypto import get_crypto_list, get_crypto_quote
from src.tools.forex import get_forex_list, get_forex_quotes
from src.tools.dcf_valuation import calculate_dcf
from src.tools.technical_indicators import get_ema

TOOLS = [
    get_company_profile, get_company_notes,
    get_quote, get_quote_change, get_aftermarket_quote,
    get_price_change,
    get_income_statement,
    search_by_symbol, search_by_name,
    get_ratings_snapshot, get_financial_estimates,
    get_price_target_news, get_price_target_latest_news,
    get_company_dividends, get_dividends_calendar,
    get_index_list, get_index_quote,
    get_biggest_gainers, get_biggest_losers, get_most_active,
    get_market_hours,
    get_commodities_list, get_commodities_prices, get_historical_price_eod_light,
    get_crypto_list, get_crypto_quote,
    get_forex_list, get_forex_quotes,
    calculate_dcf,
    get_ema,
    # TODO: fix and re-enable ETF tools
    # get_etf_sectors, get_etf_countries, get_etf_holdings,
]

for tool_fn in TOOLS:
    mcp.tool()(tool_fn)


# ---------------------------------------------------------------------------
# 4. Register resources (ONCE)
# ---------------------------------------------------------------------------
from src.resources.company import (
    get_stock_info_resource, get_stock_peers_resource, get_price_targets_resource,
)
from src.resources.market import get_market_snapshot_resource

mcp.resource("stock-info://{symbol}")(get_stock_info_resource)
mcp.resource("market-snapshot://current")(get_market_snapshot_resource)
mcp.resource("stock-peers://{symbol}")(get_stock_peers_resource)
mcp.resource("price-targets://{symbol}")(get_price_targets_resource)


# ---------------------------------------------------------------------------
# 5. Register prompts (ONCE)
# ---------------------------------------------------------------------------
from src.prompts.templates import (
    company_analysis, financial_statement_analysis, stock_comparison,
    market_outlook, investment_idea_generation, technical_analysis,
    economic_indicator_analysis,
)

for prompt_fn in [
    company_analysis, financial_statement_analysis, stock_comparison,
    market_outlook, investment_idea_generation, technical_analysis,
    economic_indicator_analysis,
]:
    mcp.prompt()(prompt_fn)


# ---------------------------------------------------------------------------
# 6. Health check helper
# ---------------------------------------------------------------------------
def _make_health_app(base_app):
    """Wrap a Starlette/ASGI app with a /health endpoint."""
    from starlette.applications import Starlette
    from starlette.routing import Mount, Route
    from starlette.responses import JSONResponse

    async def health_check(request):
        return JSONResponse({"status": "healthy", "service": "fmp-mcp-server"})

    return Starlette(
        routes=[
            Route("/health", health_check, methods=["GET"]),
            Mount("/", app=base_app),
        ],
        lifespan=base_app.router.lifespan_context if hasattr(base_app, 'router') else None,
    )

# ---------------------------------------------------------------------------
# 7. Run
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    api_status = "Yes" if os.environ.get("FMP_API_KEY") else "No - using demo mode"

    if args.sse:
        import uvicorn
        print(f"Starting FMP MCP Server (SSE) on http://{args.host}:{args.port}")
        print(f"API Key configured: {api_status}")
        app = _make_health_app(mcp.sse_app())
        uvicorn.run(app, host=args.host, port=args.port)

    elif args.streamable_http:
        import uvicorn
        mode = ("stateless" if args.stateless else "stateful") + (" JSON" if args.json_response else " SSE")
        print(f"Starting FMP MCP Server (Streamable HTTP {mode}) on http://{args.host}:{args.port}")
        print(f"API Key configured: {api_status}")
        print(f"Endpoint: http://{args.host}:{args.port}/mcp/")

        # Streamable HTTP needs proper lifespan - don't wrap, add health route directly
        from starlette.routing import Route
        from starlette.responses import JSONResponse

        async def health_check(request):
            return JSONResponse({"status": "healthy", "service": "fmp-mcp-server"})

        app = mcp.streamable_http_app()
        health_route = Route("/health", health_check, methods=["GET"])
        app.router.routes.insert(0, health_route)

        uvicorn.run(app, host=args.host, port=args.port)

    else:
        mcp.run()