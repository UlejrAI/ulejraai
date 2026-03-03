import { createMCPClient } from "@ai-sdk/mcp";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { createConnection } from "@smithery/api/mcp";
import type { Tool } from "ai";

import { type MCPServerName, mcpServers } from "./config";
import type {
  MCPClient,
  MCPConnectionState,
  MCPManagerOptions,
  MCPToolsResult,
  TransportType,
} from "./types";

/**
 * Wraps a Smithery Connect transport to fix the JSON-RPC message ID mismatch.
 *
 * The Smithery Connect proxy re-numbers message IDs internally, so response IDs
 * don't match what `@ai-sdk/mcp`'s `createMCPClient` expects. This wrapper tracks
 * outgoing request IDs and remaps incoming response IDs to match.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function wrapSmitheryTransport(innerTransport: any) {
  const pendingIds: number[] = [];

  return {
    get onclose() {
      return innerTransport.onclose;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    set onclose(v: any) {
      innerTransport.onclose = v;
    },

    get onerror() {
      return innerTransport.onerror;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    set onerror(v: any) {
      innerTransport.onerror = v;
    },

    get onmessage() {
      return innerTransport.onmessage;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    set onmessage(handler: any) {
      if (typeof handler !== "function") {
        innerTransport.onmessage = handler;
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      innerTransport.onmessage = (message: any) => {
        // If this is a response (has id but no method), remap the ID
        if (
          "id" in message &&
          !("method" in message) &&
          pendingIds.length > 0
        ) {
          const expectedId = pendingIds.shift()!;
          if (expectedId !== message.id) {
            message = { ...message, id: expectedId };
          }
        }
        handler(message);
      };
    },

    async start() {
      return innerTransport.start();
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async send(message: any) {
      // Track outgoing request IDs in order
      if ("id" in message && message.id !== undefined && "method" in message) {
        pendingIds.push(message.id);
      }
      return innerTransport.send(message);
    },

    async close() {
      return innerTransport.close();
    },

    get sessionId() {
      return innerTransport.sessionId;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    set sessionId(v: any) {
      innerTransport.sessionId = v;
    },
  };
}

export class MCPManager {
  private readonly states = new Map<string, MCPConnectionState>();
  private readonly maxRetries: number;
  private readonly conversationId: string;

  constructor(options: MCPManagerOptions) {
    this.conversationId = options.conversationId;
    this.maxRetries = options.maxRetries ?? 2;
  }

  async getTools(): Promise<MCPToolsResult> {
    const allTools: Record<string, Tool> = {};
    const failedServers: string[] = [];

    console.log(
      `[MCP] Loading tools from ${Object.keys(mcpServers).length} servers`
    );

    const connectionPromises = Object.entries(mcpServers).map(
      async ([name, config]) => {
        const serverName = name as MCPServerName;
        console.log(`[MCP] Attempting to connect to ${serverName}...`);
        const state = this.getOrInitState(serverName);

        if (state.unavailable) {
          console.log(`[MCP] ${serverName} is marked unavailable, skipping`);
          failedServers.push(serverName);
          return;
        }

        try {
          const client = await this.connect(serverName, config, state);
          if (!client) {
            console.log(`[MCP] ${serverName} - failed to connect`);
            failedServers.push(serverName);
            return;
          }

          console.log(`[MCP] ${serverName} - connected, fetching tools...`);
          const rawTools = await client.tools();
          console.log(
            `[MCP] ${serverName} - got ${Object.keys(rawTools).length} tools`
          );

          for (const [toolName, tool] of Object.entries(rawTools)) {
            const fullToolName = `${serverName}_${toolName}`;
            const wrappedTool = this.wrapWithRetry(
              tool as unknown as Tool,
              serverName,
              toolName,
              state,
              config
            );
            allTools[fullToolName] = wrappedTool;
          }
        } catch (error) {
          console.error(`[MCP] ${serverName} - failed:`, error);
          failedServers.push(serverName);
        }
      }
    );

    await Promise.all(connectionPromises);

    console.log(
      `[MCP] Final result - ${Object.keys(allTools).length} tools loaded, failed: ${failedServers.join(", ")}`
    );
    return { tools: allTools, failedServers };
  }

  private wrapWithRetry(
    tool: Tool,
    serverName: MCPServerName,
    toolName: string,
    state: MCPConnectionState,
    config: (typeof mcpServers)[MCPServerName]
  ): Tool {
    const maxRetries = this.maxRetries;
    const delayFn = this.delay.bind(this);
    const connectFn = this.connect.bind(this);

    // Mutable reference so reconnect can swap in a fresh execute function
    let currentExecute = tool.execute;

    return {
      ...tool,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      execute: async (params: any, options?: any) => {
        const fullToolName = `${serverName}_${toolName}`;

        if (typeof currentExecute !== "function") {
          throw new Error(`Tool ${fullToolName} has no execute function`);
        }

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            console.log(
              `[MCP] ▶ Executing: ${fullToolName}`,
              JSON.stringify(params)
            );
            const result = await currentExecute(params, options);
            console.log(`[MCP] ✓ Done: ${fullToolName}`);
            return result;
          } catch (error) {
            const failures = state.toolFailures.get(fullToolName) ?? 0;

            // Detect stale/broken transport — needs full reconnect
            const isTransportError =
              error instanceof Error &&
              (error.message.includes("Already connected") ||
                error.message.includes("transport") ||
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (error as any).code === 500);

            if (attempt < maxRetries) {
              state.toolFailures.set(fullToolName, failures + 1);

              if (isTransportError) {
                console.warn(
                  `[MCP] ${fullToolName} transport error, closing and reconnecting...`
                );
                // Close stale client before reconnecting
                try {
                  await state.client?.close();
                } catch {
                  // ignore close errors
                }
                state.client = null;
                await delayFn(500 * (attempt + 1));

                // Reconnect and get a fresh execute function
                const newClient = await connectFn(serverName, config, state);
                if (newClient) {
                  const freshTools = await newClient.tools();
                  const freshTool = freshTools[toolName] as Tool | undefined;
                  if (freshTool?.execute) {
                    currentExecute = freshTool.execute;
                  }
                }
              } else {
                await delayFn(500 * (attempt + 1));
              }
            } else {
              console.error(
                `Tool ${fullToolName} failed after ${maxRetries} retries:`,
                error
              );
              throw error;
            }
          }
        }
      },
    };
  }

  private async connect(
    name: MCPServerName,
    config: (typeof mcpServers)[MCPServerName],
    state: MCPConnectionState
  ): Promise<MCPClient | null> {
    if (state.client) {
      return state.client;
    }

    const transportType: TransportType =
      (config.transportType as TransportType) ?? "streamable";

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        let client: MCPClient;

        if (transportType === "smithery") {
          // Use Smithery Connect proxy with ID-fixing transport wrapper
          const smitheryApiKey = process.env.SMITHERY_API_KEY;
          if (!smitheryApiKey) {
            state.unavailable = true;
            console.warn(`MCP ${name}: SMITHERY_API_KEY not configured`);
            return null;
          }

          console.log(`[MCP] ${name} - connecting via Smithery Connect...`);
          const conn = await createConnection({
            mcpUrl: config.url,
          });
          console.log(`[MCP] ${name} - Smithery proxy URL: ${conn.url}`);

          // Wrap transport to fix the JSON-RPC ID mismatch between
          // Smithery Connect proxy and @ai-sdk/mcp
          const wrappedTransport = wrapSmitheryTransport(conn.transport);
          client = await createMCPClient({
            transport: wrappedTransport as Parameters<
              typeof createMCPClient
            >[0]["transport"],
          });
        } else if (transportType === "sse") {
          // For SSE transport MCPs
          const configAny = config as Record<string, unknown>;
          const envKey = configAny.envKey as string | undefined;
          let mcpUrl = config.url;

          if (envKey) {
            const apiKey = process.env[envKey];
            if (!apiKey) {
              state.unavailable = true;
              console.warn(`MCP ${name}: API key ${envKey} not configured`);
              return null;
            }
            const separator = config.url.includes("?") ? "&" : "?";
            mcpUrl = `${config.url}${separator}apikey=${apiKey}`;
          }

          console.log(`[MCP] ${name} - connecting to SSE: ${mcpUrl}`);
          const { SSEClientTransport } = await import(
            "@modelcontextprotocol/sdk/client/sse.js"
          );
          const transport = new SSEClientTransport(new URL(mcpUrl));
          client = await createMCPClient({ transport });
        } else {
          // Default: StreamableHTTP (e.g. for alphavantage)
          const configAny = config as Record<string, unknown>;
          const envKey = configAny.envKey as string | undefined;
          const authStyle =
            (configAny.authStyle as string | undefined) ?? "query";
          const apiKey = envKey ? process.env[envKey] : undefined;

          if (!apiKey && envKey) {
            state.unavailable = true;
            console.warn(`MCP ${name}: API key ${envKey} not configured`);
            return null;
          }

          let url = config.url;
          let requestInit: RequestInit | undefined;

          if (apiKey) {
            if (authStyle === "bearer") {
              // Pass API key as Authorization: Bearer header
              requestInit = {
                headers: { Authorization: `Bearer ${apiKey}` },
              };
            } else if (authStyle === "x-header") {
              // Pass API key as a custom header (e.g. X-CMC-MCP-API-KEY)
              const headerName =
                (configAny.headerName as string | undefined) ?? "X-Api-Key";
              requestInit = {
                headers: { [headerName]: apiKey },
              };
            } else {
              // Default: append as query parameter
              const separator = config.url.includes("?") ? "&" : "?";
              url = `${config.url}${separator}apikey=${apiKey}`;
            }
          }

          console.log(
            `[MCP] ${name} - connecting to StreamableHTTP: ${url} (auth: ${authStyle})`
          );
          const transport = new StreamableHTTPClientTransport(
            new URL(url),
            requestInit ? { requestInit } : undefined
          );
          client = await createMCPClient({ transport });
        }

        state.client = client;
        state.retryCount = 0;

        console.log(
          `MCP ${name}: Connected successfully (${transportType}) for conversation ${this.conversationId}`
        );

        return client;
      } catch (error) {
        console.error(
          `MCP ${name}: Connection attempt ${attempt + 1} failed:`,
          error
        );

        if (attempt < this.maxRetries) {
          state.retryCount++;
          await this.delay(1000 * (attempt + 1));
        } else {
          state.unavailable = true;
          console.warn(
            `MCP ${name}: Marked unavailable for conversation ${this.conversationId} after ${this.maxRetries} connection failures`
          );
        }
      }
    }

    return null;
  }

  private getOrInitState(name: MCPServerName): MCPConnectionState {
    if (!this.states.has(name)) {
      this.states.set(name, {
        client: null,
        retryCount: 0,
        unavailable: false,
        toolFailures: new Map(),
      });
    }
    return this.states.get(name) as MCPConnectionState;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async cleanup(): Promise<void> {
    for (const [, state] of this.states) {
      if (state.client) {
        try {
          await state.client.close();
        } catch (error) {
          console.error("Error closing MCP client:", error);
        }
      }
    }
    this.states.clear();
  }

  getUnavailableServers(): MCPServerName[] {
    const unavailable: MCPServerName[] = [];
    for (const [name, state] of this.states) {
      if (state.unavailable) {
        unavailable.push(name as MCPServerName);
      }
    }
    return unavailable;
  }
}
