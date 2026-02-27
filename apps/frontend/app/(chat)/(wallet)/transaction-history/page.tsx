"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  ClockIcon,
  CopyIcon,
  ExternalLinkIcon,
  FilterIcon,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Types
interface Transaction {
  id: string;
  type: "received" | "sent";
  amount: string;
  amountUsd: string;
  token: string;
  counterparty: string;
  counterpartyLabel?: string;
  timestamp: Date;
  status: "confirmed" | "pending" | "failed";
  confirmations?: number;
  txHash: string;
}

interface TransactionGroup {
  date: string;
  transactions: Transaction[];
}

// Mock data
const MOCK_TRANSACTIONS: TransactionGroup[] = [
  {
    date: "Today",
    transactions: [
      {
        id: "tx-1",
        type: "received",
        amount: "0.50",
        amountUsd: "$1,240.00",
        token: "SAL",
        counterparty: "0x71C7A2A9B2A9B2A9B2A9B2A9B2A9B2A9B2A9A2A",
        counterpartyLabel: "Exchange Deposit",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        status: "confirmed",
        confirmations: 64,
        txHash: "0xabc123...",
      },
      {
        id: "tx-2",
        type: "sent",
        amount: "0.25",
        amountUsd: "$620.00",
        token: "SAL",
        counterparty: "0xA91B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B",
        counterpartyLabel: "alice.eth",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        status: "confirmed",
        confirmations: 128,
        txHash: "0xdef456...",
      },
      {
        id: "tx-3",
        type: "sent",
        amount: "0.10",
        amountUsd: "$248.00",
        token: "SAL",
        counterparty: "0x8F3A4B5C6D7E8F9A0B1C2D3E4F5A6B7C8D9E0F1A",
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        status: "pending",
        confirmations: 2,
        txHash: "0xghi789...",
      },
    ],
  },
  {
    date: "Yesterday",
    transactions: [
      {
        id: "tx-4",
        type: "sent",
        amount: "0.15",
        amountUsd: "$372.00",
        token: "SAL",
        counterparty: "0xB12C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
        status: "failed",
        txHash: "0xjkl012...",
      },
      {
        id: "tx-5",
        type: "received",
        amount: "1.20",
        amountUsd: "$2,976.00",
        token: "SAL",
        counterparty: "0xC23D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D",
        counterpartyLabel: "bob.eth",
        timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000),
        status: "confirmed",
        confirmations: 1024,
        txHash: "0xmno345...",
      },
    ],
  },
  {
    date: "Feb 8, 2026",
    transactions: [
      {
        id: "tx-6",
        type: "sent",
        amount: "0.05",
        amountUsd: "$124.00",
        token: "SAL",
        counterparty: "0xD34E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E",
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
        status: "confirmed",
        confirmations: 2048,
        txHash: "0xpqr678...",
      },
    ],
  },
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.25,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

const groupVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

// Utility functions
function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Components
function SummaryCard({
  label,
  amount,
  type,
}: {
  label: string;
  amount: string;
  type: "in" | "out" | "net";
}) {
  const colors = {
    in: "text-emerald-600 dark:text-emerald-400",
    out: "text-foreground",
    net: "text-primary",
  };

  const bgColors = {
    in: "bg-emerald-50/50 dark:bg-emerald-950/20",
    out: "bg-muted/50",
    net: "bg-primary/5",
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-lg border border-border/50 p-4",
        bgColors[type]
      )}
    >
      <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        {label}
      </span>
      <span className={cn("font-mono text-xl font-semibold", colors[type])}>
        {amount}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: Transaction["status"] }) {
  const config = {
    confirmed: {
      icon: CheckIcon,
      label: "Confirmed",
      className:
        "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30",
    },
    pending: {
      icon: ClockIcon,
      label: "Confirming",
      className:
        "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30",
    },
    failed: {
      icon: null,
      label: "Failed",
      className: "text-destructive bg-destructive/10",
    },
  };

  const { icon: Icon, label, className } = config[status];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        className
      )}
    >
      {status === "pending" ? (
        <motion.div
          animate={{ rotate: 360 }}
          className="h-3 w-3 rounded-full border-2 border-current border-t-transparent"
          transition={{
            duration: 1,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
      ) : Icon ? (
        <Icon className="h-3 w-3" />
      ) : null}
      <span>{label}</span>
    </div>
  );
}

function TransactionItem({
  transaction,
  index,
}: {
  transaction: Transaction;
  index: number;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(transaction.counterparty);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isReceived = transaction.type === "received";
  const DirectionIcon = isReceived ? ArrowDownLeftIcon : ArrowUpRightIcon;
  const directionColor = isReceived
    ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30"
    : "text-muted-foreground bg-muted";

  return (
    <motion.div
      className="group relative"
      custom={index}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      variants={itemVariants}
    >
      <div
        className={cn(
          "flex items-center gap-4 border-b border-border/50 py-4 transition-colors last:border-b-0",
          isHovered && "bg-accent/30"
        )}
      >
        {/* Direction Icon */}
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            directionColor
          )}
        >
          <DirectionIcon className="h-5 w-5" />
        </div>

        {/* Transaction Info */}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">
              {isReceived ? "Received" : "Sent"}
            </span>
            <span className="text-muted-foreground text-sm">
              {transaction.token}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <span>{isReceived ? "From:" : "To:"}</span>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="flex items-center gap-1 font-mono hover:text-foreground transition-colors"
                    onClick={handleCopy}
                    type="button"
                  >
                    <span>
                      {transaction.counterpartyLabel ||
                        truncateAddress(transaction.counterparty)}
                    </span>
                    <motion.div
                      animate={{
                        opacity: copied ? 1 : 0,
                        scale: copied ? 1 : 0.8,
                      }}
                      className="absolute"
                      initial={{ opacity: 0 }}
                    >
                      <CheckIcon className="h-3 w-3 text-emerald-500" />
                    </motion.div>
                    <CopyIcon
                      className={cn(
                        "h-3 w-3 transition-opacity",
                        copied ? "opacity-0" : "opacity-50"
                      )}
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">
                    {copied ? "Copied!" : "Click to copy"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Amount */}
        <div className="flex flex-col items-end gap-0.5 text-right">
          <span
            className={cn(
              "font-mono font-semibold",
              isReceived
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-foreground"
            )}
          >
            {isReceived ? "+" : "-"}
            {transaction.amount} {transaction.token}
          </span>
          <span className="text-muted-foreground text-xs">
            {transaction.amountUsd}
          </span>
        </div>

        {/* Status & Time */}
        <div className="flex flex-col items-end gap-1.5 min-w-[100px]">
          <StatusBadge status={transaction.status} />
          <span className="text-muted-foreground text-xs">
            {formatTime(transaction.timestamp)}
          </span>
        </div>

        {/* Hover Actions */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1"
              exit={{ opacity: 0, x: 5 }}
              initial={{ opacity: 0, x: 5 }}
              transition={{ duration: 0.15 }}
            >
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      className="h-8 w-8"
                      onClick={handleCopy}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      {copied ? (
                        <CheckIcon className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <CopyIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">Copy address</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      className="h-8 w-8"
                      onClick={() =>
                        window.open(
                          `https://etherscan.io/tx/${transaction.txHash}`,
                          "_blank"
                        )
                      }
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <ExternalLinkIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">View on explorer</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function TransactionGroupComponent({ group }: { group: TransactionGroup }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <motion.div
      className="overflow-hidden rounded-lg border border-border/50 bg-card"
      variants={groupVariants}
    >
      {/* Group Header */}
      <button
        className="flex w-full items-center justify-between border-b border-border/50 bg-muted/30 px-4 py-3 text-left transition-colors hover:bg-muted/50"
        onClick={() => setIsExpanded(!isExpanded)}
        type="button"
      >
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">{group.date}</span>
          <span className="text-muted-foreground text-xs">
            ({group.transactions.length} transaction
            {group.transactions.length !== 1 ? "s" : ""})
          </span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
        </motion.div>
      </button>

      {/* Transactions */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            animate={{ height: "auto", opacity: 1 }}
            className="overflow-hidden"
            exit={{ height: 0, opacity: 0 }}
            initial={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <motion.div
              animate="visible"
              className="px-4"
              initial="hidden"
              variants={containerVariants}
            >
              {group.transactions.map((transaction, index) => (
                <TransactionItem
                  index={index}
                  key={transaction.id}
                  transaction={transaction}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Main Page Component
export default function TransactionHistoryPage() {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-full flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">
              Transaction History
            </h1>
            <p className="text-muted-foreground text-sm">
              View and manage your transaction activity
            </p>
          </div>
          <Button className="gap-2" type="button" variant="outline">
            <FilterIcon className="h-4 w-4" />
            Filter
          </Button>
        </div>

        {/* Summary Cards */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-3"
          initial={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <SummaryCard amount="+$1,240.00" label="Received (30d)" type="in" />
          <SummaryCard amount="-$992.00" label="Sent (30d)" type="out" />
          <SummaryCard amount="+$248.00" label="Net (30d)" type="net" />
        </motion.div>

        {/* Transaction List */}
        <motion.div
          animate="visible"
          className="flex flex-col gap-4"
          initial="hidden"
          variants={containerVariants}
        >
          {MOCK_TRANSACTIONS.map((group) => (
            <TransactionGroupComponent group={group} key={group.date} />
          ))}
        </motion.div>

        {/* Empty State (shown when no transactions) */}
        {MOCK_TRANSACTIONS.length === 0 && (
          <motion.div
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border/50 py-16"
            initial={{ opacity: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <CalendarIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium text-sm">No transactions yet</p>
              <p className="text-muted-foreground text-sm">
                Your transaction history will appear here
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </TooltipProvider>
  );
}
