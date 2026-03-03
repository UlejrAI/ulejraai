import type { Tool } from "ai";

export type TransportType = "streamable" | "smithery" | "sse";
export type AuthStyle = "query" | "bearer" | "x-header";

export interface MCPServerConfig {
  url: string;
  envKey?: string;
  transportType?: TransportType;
  authStyle?: AuthStyle;
  /** Header name to use when authStyle is "x-header" */
  headerName?: string;
}

export interface MCPConnectionState {
  client: MCPClient | null;
  retryCount: number;
  unavailable: boolean;
  toolFailures: Map<string, number>;
}

export type MCPClient = Awaited<
  ReturnType<typeof import("@ai-sdk/mcp").createMCPClient>
>;

export interface MCPManagerOptions {
  conversationId: string;
  maxRetries?: number;
}

export interface MCPToolsResult {
  tools: Record<string, Tool>;
  failedServers: string[];
}
