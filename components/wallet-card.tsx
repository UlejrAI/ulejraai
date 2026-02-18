"use client";

import { motion } from "framer-motion";
import {
  CheckIcon,
  Loader2Icon,
  ShieldCheckIcon,
  WalletIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type WalletId =
  | "metamask"
  | "phantom"
  | "walletconnect"
  | "coinbase"
  | "ledger";

export interface Wallet {
  id: WalletId;
  name: string;
  description: string;
  icon: React.ReactNode;
  popular?: boolean;
  secure?: boolean;
}

export interface WalletCardProps {
  wallet: Wallet;
  isSelected: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  onSelect: () => void;
  index: number;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.05,
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
  hover: {
    y: -2,
    transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] },
  },
  tap: { scale: 0.98 },
};

export function WalletCard({
  wallet,
  isSelected,
  isConnecting,
  isConnected,
  onSelect,
  index,
}: WalletCardProps) {
  const status = isConnected
    ? "connected"
    : isConnecting
      ? "connecting"
      : "idle";

  return (
    <motion.button
      animate="visible"
      className={cn(
        "group relative flex w-full items-center gap-4 overflow-hidden rounded-xl border p-4 text-left transition-all",
        "bg-card/50 backdrop-blur-sm",
        // Border states
        status === "idle" && "border-border/60 hover:border-primary/50",
        status === "connecting" && "border-primary/50 ring-2 ring-primary/20",
        status === "connected" && "border-emerald-500/50 bg-emerald-500/5",
        // Selection indicator
        isSelected && !isConnected && !isConnecting && "ring-1 ring-primary/30"
      )}
      custom={index}
      disabled={isConnecting}
      initial="hidden"
      onClick={onSelect}
      type="button"
      variants={cardVariants}
      whileHover={!isConnecting && !isConnected ? "hover" : undefined}
      whileTap={!isConnecting && !isConnected ? "tap" : undefined}
    >
      {/* Vault-style security indicator - left edge */}
      <div
        className={cn(
          "absolute left-0 top-0 h-full w-1 transition-colors duration-300",
          status === "idle" && "bg-border/40",
          status === "connecting" && "bg-primary animate-pulse",
          status === "connected" && "bg-emerald-500"
        )}
      />

      {/* Icon container with vault-like styling */}
      <div
        className={cn(
          "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-lg transition-all duration-300",
          "border",
          status === "idle" &&
            "border-border/60 bg-muted group-hover:border-primary/30",
          status === "connecting" && "border-primary/50 bg-primary/10",
          status === "connected" && "border-emerald-500/50 bg-emerald-500/10"
        )}
      >
        {isConnecting ? (
          <Loader2Icon className="h-5 w-5 animate-spin text-primary" />
        ) : isConnected ? (
          <CheckIcon className="h-5 w-5 text-emerald-500" />
        ) : (
          <>
            {wallet.icon}
            {/* Connection strength dots */}
            <div className="absolute -right-1 -top-1 flex gap-0.5">
              <div className="h-1 w-1 rounded-full bg-emerald-500/60" />
              <div className="h-1 w-1 rounded-full bg-emerald-500/60" />
              <div className="h-1 w-1 rounded-full bg-muted-foreground/20" />
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-sm">{wallet.name}</span>
          {wallet.popular && status === "idle" && (
            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              Popular
            </span>
          )}
          {wallet.secure && (
            <ShieldCheckIcon className="h-3.5 w-3.5 shrink-0 text-emerald-500/70" />
          )}
        </div>
        <p className="truncate text-muted-foreground text-xs">
          {wallet.description}
        </p>
      </div>

      {/* Status indicator */}
      <div className="flex shrink-0 flex-col items-end gap-1">
        {status === "connecting" && (
          <span className="text-primary text-xs">Connecting...</span>
        )}
        {status === "connected" && (
          <span className="text-emerald-500 text-xs">Connected</span>
        )}
        {status === "idle" && (
          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-border/60 bg-muted group-hover:border-primary/30">
            <WalletIcon className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Subtle gradient overlay on hover */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-primary/5 opacity-0 transition-opacity",
          status === "idle" && "group-hover:opacity-100"
        )}
      />
    </motion.button>
  );
}
