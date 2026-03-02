"""
FRED (Federal Reserve Economic Data) MCP Microservice

Exposes FRED API data as MCP tools via Streamable HTTP transport.
Free API key: https://fred.stlouisfed.org/docs/api/api_key.html

Tools:
  - search_series      : Search for FRED data series by keyword
  - get_series_info    : Get metadata for a specific series
  - get_observations   : Get data points for a series (time series)
  - get_releases       : List recent economic data releases
  - get_release_series : List series belonging to a release
"""

import os

import httpx
from mcp.server.fastmcp import FastMCP

FRED_API_KEY = os.environ.get("FRED_API_KEY", "")
FRED_BASE = "https://api.stlouisfed.org/fred"
_port = int(os.environ.get("PORT", 8080))

mcp = FastMCP("FRED Economic Data", host="0.0.0.0", port=_port)


def _get(endpoint: str, **params) -> dict:
    """Make a GET request to the FRED API."""
    if not FRED_API_KEY:
        raise RuntimeError("FRED_API_KEY environment variable is not set.")
    response = httpx.get(
        f"{FRED_BASE}/{endpoint}",
        params={"api_key": FRED_API_KEY, "file_type": "json", **params},
        timeout=15,
    )
    response.raise_for_status()
    return response.json()


@mcp.tool()
def search_series(query: str, limit: int = 10) -> dict:
    """Search for FRED economic data series by keyword.

    Args:
        query: Search term (e.g. "GDP", "unemployment", "inflation", "CPI")
        limit: Maximum number of results to return (default 10, max 1000)
    """
    data = _get(
        "series/search",
        search_text=query,
        limit=min(limit, 100),
        order_by="popularity",
        sort_order="desc",
    )
    results = []
    for s in data.get("seriess", []):
        results.append(
            {
                "id": s["id"],
                "title": s["title"],
                "frequency": s.get("frequency_short", ""),
                "units": s.get("units_short", ""),
                "seasonal_adjustment": s.get("seasonal_adjustment_short", ""),
                "last_updated": s.get("last_updated", ""),
                "popularity": s.get("popularity", 0),
                "notes": s.get("notes", "")[:200] if s.get("notes") else "",
            }
        )
    return {"count": data.get("count", 0), "series": results}


@mcp.tool()
def get_series_info(series_id: str) -> dict:
    """Get metadata for a specific FRED data series.

    Args:
        series_id: The FRED series ID (e.g. "GDP", "UNRATE", "CPIAUCSL", "FEDFUNDS")

    Common series IDs:
        GDP      - Gross Domestic Product
        UNRATE   - Unemployment Rate
        CPIAUCSL - Consumer Price Index (All Urban, All Items)
        FEDFUNDS - Federal Funds Effective Rate
        DGS10    - 10-Year Treasury Constant Maturity Rate
        SP500    - S&P 500 Index
        M2SL     - M2 Money Stock
        USREC    - NBER based Recession Indicators
    """
    data = _get("series", series_id=series_id)
    series = data.get("seriess", [{}])[0]
    return {
        "id": series.get("id"),
        "title": series.get("title"),
        "frequency": series.get("frequency"),
        "units": series.get("units"),
        "seasonal_adjustment": series.get("seasonal_adjustment"),
        "last_updated": series.get("last_updated"),
        "observation_start": series.get("observation_start"),
        "observation_end": series.get("observation_end"),
        "notes": series.get("notes", ""),
    }


@mcp.tool()
def get_observations(
    series_id: str,
    observation_start: str = "",
    observation_end: str = "",
    limit: int = 20,
    sort_order: str = "desc",
) -> dict:
    """Get time series observations (data points) for a FRED series.

    Args:
        series_id: The FRED series ID (e.g. "GDP", "UNRATE", "CPIAUCSL")
        observation_start: Start date in YYYY-MM-DD format (optional)
        observation_end: End date in YYYY-MM-DD format (optional)
        limit: Number of observations to return (default 20, max 100000)
        sort_order: "desc" (newest first) or "asc" (oldest first)
    """
    params: dict = {
        "series_id": series_id,
        "limit": min(limit, 1000),
        "sort_order": sort_order,
    }
    if observation_start:
        params["observation_start"] = observation_start
    if observation_end:
        params["observation_end"] = observation_end

    data = _get("series/observations", **params)
    obs = [
        {"date": o["date"], "value": o["value"]}
        for o in data.get("observations", [])
        if o.get("value") != "."
    ]
    return {
        "series_id": series_id,
        "count": len(obs),
        "observations": obs,
    }


@mcp.tool()
def get_releases(limit: int = 20) -> dict:
    """Get recent economic data releases from FRED.

    Args:
        limit: Number of releases to return (default 20)
    """
    data = _get(
        "releases",
        limit=min(limit, 100),
        order_by="press_release",
        sort_order="desc",
    )
    releases = [
        {
            "id": r["id"],
            "name": r["name"],
            "press_release": r.get("press_release", False),
            "link": r.get("link", ""),
        }
        for r in data.get("releases", [])
    ]
    return {"count": len(releases), "releases": releases}


@mcp.tool()
def get_release_series(release_id: int, limit: int = 20) -> dict:
    """Get all data series belonging to a specific FRED release.

    Args:
        release_id: FRED release ID (get from get_releases())
        limit: Number of series to return (default 20)
    """
    data = _get(
        "release/series",
        release_id=release_id,
        limit=min(limit, 100),
        order_by="popularity",
        sort_order="desc",
    )
    series = [
        {
            "id": s["id"],
            "title": s["title"],
            "frequency": s.get("frequency_short", ""),
            "units": s.get("units_short", ""),
        }
        for s in data.get("seriess", [])
    ]
    return {"release_id": release_id, "count": len(series), "series": series}


if __name__ == "__main__":
    mcp.run(transport="streamable-http")
