"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import type { ToolUIPart } from "ai";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  Loader2Icon,
  XCircleIcon,
} from "lucide-react";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
import { Button } from "@/components/ui/button";
import type { ChatMessage } from "@/lib/types";

type MessageChainOfThoughtProps = {
  addToolApprovalResponse: UseChatHelpers<ChatMessage>["addToolApprovalResponse"];
  isLoading: boolean;
  message: ChatMessage;
};

const toolTypeLabels: Record<string, string> = {
  // Built-in tools
  "tool-getWeather": "Get Weather",
  "tool-createDocument": "Create Document",
  "tool-createInvoice": "Create Invoice",
  "tool-updateDocument": "Update Document",
  "tool-requestSuggestions": "Get Suggestions",
  // Iroha tools
  "tool-getBalance": "Get Balance",
  "tool-getWalletInfo": "Get Wallet Info",
  "tool-getNotifications": "Get Notifications",
  "tool-markNotificationRead": "Mark Notification Read",
  "tool-getTransferRequests": "Get Transfer Requests",
  "tool-getRequestDetails": "Get Request Details",
  "tool-getUserInfo": "Get User Info",
  "tool-getContactInfo": "Get Contact Info",
  "tool-updateContactInfo": "Update Contact Info",
  "tool-getCompanies": "Get Companies",
  "tool-transferFunds": "Transfer Funds",
  "tool-exchangeAsset": "Exchange Asset",
  "tool-setBalance": "Set Balance",
  // AlphaVantage MCP (prefixed)
  "tool-alphavantage_TOOL_LIST": "AlphaVantage: List Tools",
  "tool-alphavantage_TOOL_GET": "AlphaVantage: Get Tool Info",
  "tool-alphavantage_TOOL_CALL": "AlphaVantage: Fetch Data",
  // CoinMarketCap MCP
  "tool-coinmarketcap_getLatestListings": "CoinMarketCap: Listings",
  "tool-coinmarketcap_getQuotes": "CoinMarketCap: Quotes",
  // CoinGecko MCP
  "tool-coingecko_get_simple_price": "CoinGecko: Price",
  "tool-coingecko_get_coins_markets": "CoinGecko: Markets",
  "tool-coingecko_get_search_trending": "CoinGecko: Trending",
  "tool-coingecko_get_search": "CoinGecko: Search",
  "tool-coingecko_get_global": "CoinGecko: Global Market",
  "tool-coingecko_get_coins_top_gainers_losers": "CoinGecko: Top Gainers/Losers",
  "tool-coingecko_get_coins_history": "CoinGecko: Price History",
  "tool-coingecko_get_id_coins": "CoinGecko: Coin Info",
  "tool-coingecko_get_id_exchanges": "CoinGecko: Exchange Info",
  "tool-coingecko_get_id_nfts": "CoinGecko: NFT Info",
  // Tavily MCP
  "tool-tavily_tavily_search": "Web Search",
  "tool-tavily_tavily_extract": "Web Extract",
  "tool-tavily_tavily_crawl": "Web Crawl",
  "tool-tavily_tavily_map": "Web Map",
  "tool-tavily_tavily_research": "Deep Research",
  // FRED MCP
  "tool-fred_search_series": "FRED: Search Series",
  "tool-fred_get_series_info": "FRED: Series Info",
  "tool-fred_get_observations": "FRED: Economic Data",
  "tool-fred_get_releases": "FRED: Releases",
  "tool-fred_get_release_series": "FRED: Release Series",
};

function formatToolLabel(toolType: string): string {
  if (toolTypeLabels[toolType]) return toolTypeLabels[toolType];

  // Strip "tool-" prefix then prettify
  const name = toolType.replace(/^tool-/, "");

  // Detect MCP prefix (e.g. "coingecko_get_simple_price" → "CoinGecko: Get Simple Price")
  const mcpPrefixes: Record<string, string> = {
    alphavantage: "AlphaVantage",
    coinmarketcap: "CoinMarketCap",
    coingecko: "CoinGecko",
    tavily: "Tavily",
    fred: "FRED",
  };

  for (const [prefix, label] of Object.entries(mcpPrefixes)) {
    if (name.startsWith(`${prefix}_`)) {
      const rest = name.slice(prefix.length + 1);
      const readable = rest
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      return `${label}: ${readable}`;
    }
  }

  // Fallback: snake_case / camelCase → Title Case
  return name
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const getStatusFromToolState = (
  state: ToolUIPart["state"]
): "pending" | "active" | "complete" => {
  switch (state) {
    case "input-streaming":
    case "input-available":
    case "approval-requested":
      return "active";
    case "approval-responded":
    case "output-available":
    case "output-denied":
    case "output-error":
      return "complete";
    default:
      return "pending";
  }
};

const getIconFromToolState = (state: ToolUIPart["state"]): LucideIcon => {
  switch (state) {
    case "input-streaming":
      return Loader2Icon;
    case "input-available":
      return Loader2Icon;
    case "approval-requested":
      return ClockIcon;
    case "approval-responded":
      return CheckCircleIcon;
    case "output-available":
      return CheckCircleIcon;
    case "output-denied":
      return XCircleIcon;
    case "output-error":
      return AlertCircleIcon;
    default:
      return ClockIcon;
  }
};

function ToolApproval({
  approvalId,
  onApprove,
  onDeny,
}: {
  approvalId: string;
  onApprove: (id: string, approved: boolean) => void;
  onDeny: (id: string, approved: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
      <Button
        className="rounded-md px-3 py-1.5 text-sm"
        onClick={() => onDeny(approvalId, false)}
        type="button"
        variant="ghost"
      >
        Deny
      </Button>
      <Button
        className="rounded-md px-3 py-1.5 text-sm"
        onClick={() => onApprove(approvalId, true)}
        type="button"
        variant="default"
      >
        Allow
      </Button>
    </div>
  );
}

function ToolStepContent({
  part,
  onApprove,
  onDeny,
}: {
  part: ToolUIPart;
  onApprove: (id: string, approved: boolean) => void;
  onDeny: (id: string, approved: boolean) => void;
}) {
  const state = part.state;
  const approvalId = (part as { approval?: { id: string } }).approval?.id;

  const showInput =
    state === "input-available" ||
    state === "approval-requested" ||
    state === "approval-responded";
  const showOutput = state === "output-available" || state === "output-error";
  const showApproval = state === "approval-requested" && approvalId;

  return (
    <div className="space-y-2 overflow-hidden p-3">
      {showInput && (
        <div>
          <div className="mb-1 font-medium text-xs text-muted-foreground uppercase tracking-wide">
            Parameters
          </div>
          <pre className="overflow-x-auto rounded-md bg-muted/50 p-2 font-mono text-xs">
            {JSON.stringify(part.input, null, 2)}
          </pre>
        </div>
      )}

      {showOutput && (
        <div>
          <div className="mb-1 font-medium text-xs text-muted-foreground uppercase tracking-wide">
            Result
          </div>
          <pre className="max-h-32 overflow-x-auto rounded-md bg-muted/50 p-2 font-mono text-xs">
            {JSON.stringify(part.output, null, 2)}
          </pre>
        </div>
      )}

      {state === "output-denied" && (
        <div className="rounded-md bg-orange-500/10 p-2 text-sm text-orange-600">
          Tool use was denied
        </div>
      )}

      {state === "output-error" && (
        <div className="rounded-md bg-red-500/10 p-2 text-sm text-red-600">
          {part.errorText || "An error occurred"}
        </div>
      )}

      {showApproval && approvalId && (
        <ToolApproval
          approvalId={approvalId}
          onApprove={onApprove}
          onDeny={onDeny}
        />
      )}
    </div>
  );
}

export function MessageChainOfThought({
  addToolApprovalResponse,
  isLoading,
  message,
}: MessageChainOfThoughtProps) {
  const BUILT_IN_TOOLS = [
    "tool-getWeather",
    "tool-createDocument",
    "tool-createInvoice",
    "tool-updateDocument",
    "tool-requestSuggestions",
  ];

  const toolParts =
    message.parts?.filter(
      (part) =>
        part.type.startsWith("tool-") && !BUILT_IN_TOOLS.includes(part.type)
    ) ?? [];

  const hasTextContent = message.parts?.some(
    (part) => part.type === "text" && (part as { text?: string }).text?.trim()
  ) ?? false;

  if (toolParts.length === 0 && (!isLoading || hasTextContent)) {
    return null;
  }

  const handleApprove = (id: string, approved: boolean) => {
    addToolApprovalResponse?.({ id, approved });
  };

  const handleDeny = (id: string, approved: boolean) => {
    addToolApprovalResponse?.({ id, approved, reason: "User denied" });
  };

  const isStreaming = isLoading;

  const allToolsDone =
    toolParts.length > 0 &&
    toolParts.every((p) => {
      const state = (p as ToolUIPart).state;
      return (
        state === "output-available" ||
        state === "output-denied" ||
        state === "output-error"
      );
    });

  return (
    <ChainOfThought defaultOpen={true} isStreaming={isStreaming}>
      <ChainOfThoughtHeader />
      <ChainOfThoughtContent>
        {toolParts.length === 0 && isLoading && !hasTextContent && (
          <ChainOfThoughtStep
            description="Selecting relevant tools..."
            icon={Loader2Icon}
            key="thinking-placeholder"
            label="Preparing"
            status="active"
          />
        )}
        {toolParts.map((part, index) => {          const toolPart = part as ToolUIPart;
          const toolType = part.type;
          const state = toolPart.state;
          const toolCallId =
            "toolCallId" in toolPart ? toolPart.toolCallId : `tool-${index}`;
          const status = getStatusFromToolState(state);
          const Icon = getIconFromToolState(state);
          const toolLabel = formatToolLabel(toolType);

          const statusLabels: Record<ToolUIPart["state"], string> = {
            "input-streaming": "Starting...",
            "input-available": "Running",
            "approval-requested": "Awaiting approval",
            "approval-responded": "Approved",
            "output-available": "Completed",
            "output-denied": "Denied",
            "output-error": "Error",
          };

          return (
            <ChainOfThoughtStep
              description={statusLabels[state]}
              icon={Icon}
              key={toolCallId}
              label={toolLabel}
              status={status}
            >
              <ToolStepContent
                onApprove={handleApprove}
                onDeny={handleDeny}
                part={toolPart}
              />
            </ChainOfThoughtStep>
          );
        })}
        {allToolsDone && isLoading && !hasTextContent && (
          <ChainOfThoughtStep
            description="Processing results..."
            icon={Loader2Icon}
            key="generating-response"
            label="Generating response"
            status="active"
          />
        )}
      </ChainOfThoughtContent>
    </ChainOfThought>
  );
}
