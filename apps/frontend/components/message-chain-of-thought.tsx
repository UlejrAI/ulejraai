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
  // AlphaVantage MCP
  "tool-get_quote": "Stock Quote",
  "tool-get_time_series_daily": "Daily Price History",
  "tool-get_company_overview": "Company Overview",
  "tool-get_income_statement": "Income Statement",
  // CoinMarketCap MCP
  "tool-getLatestListings": "Crypto Listings",
  "tool-getQuotes": "Crypto Quotes",
  // CoinGecko MCP
  "tool-get_coin_price": "Coin Price",
  "tool-get_trending_coins": "Trending Coins",
  // Tavily MCP
  "tool-tavily-search": "Web Search",
  "tool-tavily_search": "Web Search",
  // FRED MCP
  "tool-search_series": "FRED: Search Series",
  "tool-get_series_info": "FRED: Series Info",
  "tool-get_observations": "FRED: Economic Data",
  "tool-get_releases": "FRED: Releases",
  "tool-get_release_series": "FRED: Release Series",
};

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
          const toolLabel = toolTypeLabels[toolType] || toolType;

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
