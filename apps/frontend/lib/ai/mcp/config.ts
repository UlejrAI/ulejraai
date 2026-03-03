import type { MCPServerConfig } from "./types";

export const mcpServers = {
  alphavantage: {
    url: process.env.ALPHAVANTAGE_MCP_URL || "https://mcp.alphavantage.co/mcp",
    envKey: "ALPHAVANTAGE_API_KEY",
    transportType: "streamable",
  },
  coinmarketcap: {
    url:
      process.env.COINMARKETCAP_MCP_URL || "https://mcp.coinmarketcap.com/mcp",
    envKey: "COINMARKETCAP_API_KEY",
    transportType: "streamable",
    authStyle: "x-header",
    headerName: "X-CMC-MCP-API-KEY",
  },
  tavily: {
    url:
      process.env.TAVILY_MCP_URL ||
      `https://mcp.tavily.com/mcp/?tavilyApiKey=${process.env.TAVILY_API_KEY}`,
    transportType: "streamable",
  },
  coingecko: {
    url: process.env.COINGECKO_MCP_URL || "https://mcp.api.coingecko.com/mcp",
    transportType: "streamable",
  },
  fred: {
    url: process.env.FRED_MCP_URL || "http://localhost:8022/mcp",
    envKey: "FRED_API_KEY",
    transportType: "streamable",
  },
} as const satisfies Record<string, MCPServerConfig>;

export type MCPServerName = keyof typeof mcpServers;

export function getMCPServerConfig(name: MCPServerName): MCPServerConfig {
  return mcpServers[name];
}

export function getAllMCPServerNames(): MCPServerName[] {
  return Object.keys(mcpServers) as MCPServerName[];
}
