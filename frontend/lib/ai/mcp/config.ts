import type { MCPServerConfig } from "./types";

export const mcpServers = {
  alphavantage: {
    url: process.env.ALPHAVANTAGE_MCP_URL || "https://mcp.alphavantage.co/mcp",
    envKey: "ALPHAVANTAGE_API_KEY",
    transportType: "streamable",
  },
  coinmarketcap: {
    url:
      process.env.COINMARKETCAP_MCP_URL ||
      "https://coinmarketcap-mcp--shinzo-labs.run.tools",
    envKey: "COINMARKETCAP_API_KEY",
    transportType: "smithery",
  },
} as const satisfies Record<string, MCPServerConfig>;

export type MCPServerName = keyof typeof mcpServers;

export function getMCPServerConfig(name: MCPServerName): MCPServerConfig {
  return mcpServers[name];
}

export function getAllMCPServerNames(): MCPServerName[] {
  return Object.keys(mcpServers) as MCPServerName[];
}
