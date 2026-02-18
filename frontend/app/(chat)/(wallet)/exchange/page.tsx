"use client";

import { CheckIcon, SearchIcon, WalletIcon, XIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type WalletId = string;
type Category = "all" | "exchanges" | "blockchains" | "wallets";

interface WalletOption {
  id: WalletId;
  name: string;
  category: Category;
  iconPath: string;
}

const WALLET_OPTIONS: WalletOption[] = [
  // Exchanges
  {
    id: "binance",
    name: "Binance",
    category: "exchanges",
    iconPath: "/svgs/binance.svg",
  },
  {
    id: "coinbase",
    name: "Coinbase",
    category: "exchanges",
    iconPath: "/svgs/coinbase.svg",
  },
  // Blockchains
  {
    id: "ethereum",
    name: "Ethereum",
    category: "blockchains",
    iconPath: "/svgs/eth.svg",
  },
  {
    id: "bitcoin",
    name: "Bitcoin",
    category: "blockchains",
    iconPath: "/svgs/btc.svg",
  },
  {
    id: "solana",
    name: "Solana",
    category: "blockchains",
    iconPath: "/svgs/sol.svg",
  },
  {
    id: "polygon",
    name: "Polygon",
    category: "blockchains",
    iconPath: "/svgs/matic.svg",
  },
  // Wallets
  {
    id: "metamask",
    name: "MetaMask",
    category: "wallets",
    iconPath: "/svgs/metamask.svg",
  },
];

const TABS = [
  { id: "all", label: "All" },
  { id: "exchanges", label: "Exchanges" },
  { id: "blockchains", label: "Blockchains" },
  { id: "wallets", label: "Wallets" },
] as const;

export default function ExchangePage() {
  const [selectedTab, setSelectedTab] = useState<Category>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWallets, setSelectedWallets] = useState<Set<WalletId>>(
    new Set()
  );

  const filteredWallets = useMemo(() => {
    return WALLET_OPTIONS.filter((wallet) => {
      const matchesTab =
        selectedTab === "all" || wallet.category === selectedTab;
      const matchesSearch = wallet.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [selectedTab, searchQuery]);

  const toggleWallet = (walletId: WalletId) => {
    setSelectedWallets((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(walletId)) {
        newSet.delete(walletId);
      } else {
        newSet.add(walletId);
      }
      return newSet;
    });
  };

  const clearSelection = () => {
    setSelectedWallets(new Set());
  };

  const handleDone = () => {
    // TODO: Navigate to exchange or show success
  };

  return (
    <div className="flex flex-col bg-background rounded-[inherit]">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4 rounded-t-[inherit]">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <WalletIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-lg">Add your wallets</h1>
              <p className="text-muted-foreground text-sm">
                Connect wallets to start trading
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {selectedWallets.size > 0 && (
              <button
                className="text-muted-foreground text-sm hover:text-foreground"
                onClick={clearSelection}
                type="button"
              >
                Clear ({selectedWallets.size})
              </button>
            )}
            <Button
              disabled={selectedWallets.size === 0}
              onClick={handleDone}
              type="button"
            >
              Done
              {selectedWallets.size > 0 && (
                <span className="ml-1">({selectedWallets.size})</span>
              )}
            </Button>
          </div>
        </div>{" "}
      </header>

      {/* Main content */}
      <main className="flex-1 px-6 py-6">
        <div className="mx-auto max-w-6xl">
          {/* Tabs and Search */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Tabs */}
            <div className="flex gap-1 rounded-lg bg-muted p-1">
              {TABS.map((tab) => (
                <button
                  className={cn(
                    "rounded-md px-4 py-2 text-sm font-medium transition-all",
                    selectedTab === tab.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {/* Search */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="w-full pl-9 sm:w-64"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                type="text"
                value={searchQuery}
              />
              {searchQuery && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearchQuery("")}
                  type="button"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              )}
            </div>{" "}
          </div>

          {/* Wallet Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredWallets.map((wallet) => {
              const isSelected = selectedWallets.has(wallet.id);

              return (
                <button
                  className={cn(
                    "group flex items-center gap-3 rounded-lg border p-4 text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/50 hover:bg-accent"
                  )}
                  key={wallet.id}
                  onClick={() => toggleWallet(wallet.id)}
                  type="button"
                >
                  {/* Icon */}
                  {/* biome-ignore lint: SVG icons loaded from local public folder */}
                  <img
                    alt={wallet.name}
                    className="h-10 w-10 shrink-0 rounded-lg bg-muted object-contain p-1"
                    src={wallet.iconPath}
                  />

                  {/* Name */}
                  <span className="flex-1 truncate font-medium text-sm">
                    {wallet.name}
                  </span>

                  {/* Selection indicator */}
                  <div
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background group-hover:border-primary/50"
                    )}
                  >
                    {isSelected && <CheckIcon className="h-3 w-3" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Empty state */}
          <div className="mt-12 text-center">
            {filteredWallets.length === 0 && (
              <>
                <p className="mb-2 text-muted-foreground">No wallets found</p>
                <button
                  className="text-primary text-sm hover:underline"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedTab("all");
                  }}
                  type="button"
                >
                  Clear filters
                </button>
              </>
            )}
          </div>
        </div>{" "}
      </main>
    </div>
  );
}
