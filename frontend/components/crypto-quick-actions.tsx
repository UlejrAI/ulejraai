"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeftRightIcon,
  ArrowUpRightIcon,
  BarChart3Icon,
  BellIcon,
  Building2Icon,
  CalendarIcon,
  ChevronRightIcon,
  CreditCardIcon,
  DollarSignIcon,
  DownloadIcon,
  FileTextIcon,
  HistoryIcon,
  LandmarkIcon,
  type LucideIcon,
  NewspaperIcon,
  PieChartIcon,
  ReceiptIcon,
  RepeatIcon,
  SendIcon,
  ShieldIcon,
  SparklesIcon,
  TrendingUpIcon,
  UserIcon,
  WalletIcon,
  XIcon,
  ZapIcon,
} from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type CryptoActionId =
  | "pay"
  | "deposit"
  | "convert"
  | "sendStablecoins"
  | "stockData"
  | "financialData"
  | "financialNews"
  | "exchangeIntegration"
  | "automateInvoices"
  | "payBills"
  | "manageSubscriptions";

interface CryptoSubSuggestion {
  id: string;
  label: string;
  template: string;
  description: string;
  icon: LucideIcon;
}

interface CryptoAction {
  id: CryptoActionId;
  label: string;
  icon: LucideIcon;
  description: string;
  subDescription: string;
  badge?: string;
}

const CRYPTO_ACTIONS: CryptoAction[] = [
  {
    id: "stockData",
    label: "Stock Data",
    icon: BarChart3Icon,
    description: "Track stock prices and performance",
    subDescription: "Real-time quotes, charts, and market analysis",
    badge: "New",
  },
  {
    id: "financialData",
    label: "Financial Data",
    icon: PieChartIcon,
    description: "View comprehensive market data",
    subDescription: "Portfolio analytics, trends, and insights",
  },
  {
    id: "financialNews",
    label: "Financial News",
    icon: NewspaperIcon,
    description: "Latest market news and updates",
    subDescription: "Curated financial news and analysis",
  },
  {
    id: "exchangeIntegration",
    label: "Exchange Integration",
    icon: Building2Icon,
    description: "Connect your exchange accounts",
    subDescription: "Sync balances, trades, and portfolio data",
  },
  {
    id: "automateInvoices",
    label: "Automate Invoices",
    icon: FileTextIcon,
    description: "Create and automate recurring invoices",
    subDescription: "Auto-send invoices and payment reminders",
  },
  {
    id: "payBills",
    label: "Pay Bills",
    icon: ReceiptIcon,
    description: "Pay utilities and services",
    subDescription: "Electricity, internet, subscriptions & more",
  },
  {
    id: "manageSubscriptions",
    label: "Manage Subscriptions",
    icon: CalendarIcon,
    description: "Track and manage recurring payments",
    subDescription: "Monitor subscriptions, cancel unused services",
  },
  {
    id: "pay",
    label: "Pay",
    icon: SendIcon,
    description: "Send crypto to anyone",
    subDescription: "Transfer to wallets, pay bills, or send to contacts",
  },
  {
    id: "deposit",
    label: "Deposit",
    icon: DownloadIcon,
    description: "Add funds to your wallet",
    subDescription: "Bank transfer, card payment, or crypto deposit",
  },
  {
    id: "convert",
    label: "Convert",
    icon: ArrowLeftRightIcon,
    description: "Swap between cryptocurrencies",
    subDescription: "Exchange at the best rates with minimal slippage",
    badge: "Popular",
  },
  {
    id: "sendStablecoins",
    label: "Send Stablecoins",
    icon: DollarSignIcon,
    description: "Send USDC, USDT, and stable assets",
    subDescription: "Low-fee transfers with price stability",
  },
];

const CRYPTO_SUB_SUGGESTIONS: Record<CryptoActionId, CryptoSubSuggestion[]> = {
  pay: [
    {
      id: "pay-address",
      label: "Send to Address",
      template: "Pay 100 SAL to ",
      description: "Transfer to any wallet address",
      icon: WalletIcon,
    },
    {
      id: "pay-contact",
      label: "Send to Contact",
      template: "Pay Alice 100 SAL",
      description: "Quick pay to saved contacts",
      icon: UserIcon,
    },
    {
      id: "pay-bills",
      label: "Pay Bills",
      template: "Pay my electricity bill with SAL",
      description: "Utilities, subscriptions & services",
      icon: ReceiptIcon,
    },
    {
      id: "pay-international",
      label: "International",
      template: "Send $500 to family abroad",
      description: "Fast global transfers with low fees",
      icon: ArrowUpRightIcon,
    },
  ],
  deposit: [
    {
      id: "deposit-bank",
      label: "Bank Transfer",
      template: "Deposit from my bank account",
      description: "ACH, wire, or SEPA transfer",
      icon: WalletIcon,
    },
    {
      id: "deposit-card",
      label: "Debit / Credit Card",
      template: "Deposit using credit card",
      description: "Instant deposits with card",
      icon: CreditCardIcon,
    },
    {
      id: "deposit-crypto",
      label: "Crypto Transfer",
      template: "Deposit USD to my wallet",
      description: "From another wallet or exchange",
      icon: ArrowLeftRightIcon,
    },
    {
      id: "deposit-recurring",
      label: "Recurring Deposit",
      template: "Set up weekly auto-deposit of $100",
      description: "Schedule automatic purchases",
      icon: TrendingUpIcon,
    },
  ],
  convert: [
    {
      id: "convert-market",
      label: "Market Order",
      template: "Convert 0.5 SAL to USD at market price",
      description: "Instant execution at current rate",
      icon: ZapIcon,
    },
    {
      id: "convert-limit",
      label: "Limit Order",
      template: "Convert SAL to USD when price reaches $2.50",
      description: "Set your target price",
      icon: TrendingUpIcon,
    },
    {
      id: "convert-best",
      label: "Best Rate",
      template: "Convert with best exchange rate",
      description: "We find the optimal route",
      icon: SparklesIcon,
    },
    {
      id: "convert-bridge",
      label: "Cross-Chain",
      template: "Bridge SAL from Ethereum to Solana",
      description: "Move assets between networks",
      icon: ArrowLeftRightIcon,
    },
  ],
  sendStablecoins: [
    {
      id: "send-usdc",
      label: "Send USDC",
      template: "Send 100 USDC to ",
      description: "USD Coin - widely accepted stablecoin",
      icon: DollarSignIcon,
    },
    {
      id: "send-usdt",
      label: "Send USDT",
      template: "Send 100 USDT to ",
      description: "Tether - high liquidity stablecoin",
      icon: DollarSignIcon,
    },
    {
      id: "send-dai",
      label: "Send DAI",
      template: "Send 100 DAI to ",
      description: "Decentralized stablecoin by MakerDAO",
      icon: ShieldIcon,
    },
    {
      id: "send-batch",
      label: "Batch Payment",
      template: "Send stablecoins to multiple recipients",
      description: "Pay multiple people in one transaction",
      icon: RepeatIcon,
    },
  ],
  stockData: [
    {
      id: "stock-quote",
      label: "Stock Quote",
      template: "Get current price of AAPL",
      description: "Real-time stock price and change",
      icon: TrendingUpIcon,
    },
    {
      id: "stock-chart",
      label: "Price Chart",
      template: "Show AAPL price chart for last 30 days",
      description: "Visual price history and trends",
      icon: BarChart3Icon,
    },
    {
      id: "stock-analysis",
      label: "Technical Analysis",
      template: "Analyze TSLA technical indicators",
      description: "RSI, MACD, moving averages",
      icon: SparklesIcon,
    },
    {
      id: "stock-compare",
      label: "Compare Stocks",
      template: "Compare AAPL vs MSFT performance",
      description: "Side-by-side stock comparison",
      icon: ArrowLeftRightIcon,
    },
  ],
  financialData: [
    {
      id: "portfolio-overview",
      label: "Portfolio Overview",
      template: "Show my portfolio performance",
      description: "Total value, gains, and allocation",
      icon: PieChartIcon,
    },
    {
      id: "market-overview",
      label: "Market Overview",
      template: "Show crypto market overview",
      description: "Market cap, volume, top movers",
      icon: BarChart3Icon,
    },
    {
      id: "yield-farming",
      label: "Yield Opportunities",
      template: "Find best yield farming rates",
      description: "APY comparisons across protocols",
      icon: TrendingUpIcon,
    },
    {
      id: "risk-analysis",
      label: "Risk Analysis",
      template: "Analyze my portfolio risk",
      description: "Volatility, correlation, and exposure",
      icon: ShieldIcon,
    },
  ],
  financialNews: [
    {
      id: "news-latest",
      label: "Latest News",
      template: "Show latest crypto news",
      description: "Breaking news and market updates",
      icon: NewspaperIcon,
    },
    {
      id: "news-watchlist",
      label: "My Watchlist",
      template: "News for my watchlist coins",
      description: "News related to your holdings",
      icon: BellIcon,
    },
    {
      id: "news-analysis",
      label: "Market Analysis",
      template: "Get expert market analysis",
      description: "In-depth market commentary",
      icon: SparklesIcon,
    },
    {
      id: "news-regulatory",
      label: "Regulatory Updates",
      template: "Show regulatory news",
      description: "Policy changes and compliance news",
      icon: LandmarkIcon,
    },
  ],
  exchangeIntegration: [
    {
      id: "exchange-connect",
      label: "Connect Exchange",
      template: "Connect my Binance account",
      description: "Link your exchange via API",
      icon: Building2Icon,
    },
    {
      id: "exchange-balances",
      label: "View Balances",
      template: "Show all my exchange balances",
      description: "Aggregate view across exchanges",
      icon: WalletIcon,
    },
    {
      id: "exchange-trades",
      label: "Trade History",
      template: "Show my recent trades",
      description: "Unified trade history view",
      icon: HistoryIcon,
    },
    {
      id: "exchange-arbitrage",
      label: "Arbitrage Scanner",
      template: "Find arbitrage opportunities",
      description: "Price differences across exchanges",
      icon: ArrowLeftRightIcon,
    },
  ],
  automateInvoices: [
    {
      id: "invoice-create",
      label: "Create Invoice",
      template: "Create new invoice for $500",
      description: "Generate professional invoice",
      icon: FileTextIcon,
    },
    {
      id: "invoice-recurring",
      label: "Recurring Invoices",
      template: "Set up monthly recurring invoice",
      description: "Auto-send invoices on schedule",
      icon: RepeatIcon,
    },
    {
      id: "invoice-templates",
      label: "Templates",
      template: "Manage invoice templates",
      description: "Save and reuse invoice formats",
      icon: SparklesIcon,
    },
    {
      id: "invoice-reminders",
      label: "Auto Reminders",
      template: "Set up payment reminders",
      description: "Automatic follow-up emails",
      icon: BellIcon,
    },
  ],
  payBills: [
    {
      id: "bills-electricity",
      label: "Electricity",
      template: "Pay my electricity bill",
      description: "Utility bill payment",
      icon: ZapIcon,
    },
    {
      id: "bills-internet",
      label: "Internet & Phone",
      template: "Pay internet and phone bills",
      description: "ISP and telecom payments",
      icon: ArrowUpRightIcon,
    },
    {
      id: "bills-credit",
      label: "Credit Cards",
      template: "Pay my credit card bill",
      description: "Credit card statement payment",
      icon: CreditCardIcon,
    },
    {
      id: "bills-scheduled",
      label: "Scheduled Payments",
      template: "Set up automatic bill pay",
      description: "Auto-pay recurring bills",
      icon: CalendarIcon,
    },
  ],
  manageSubscriptions: [
    {
      id: "sub-overview",
      label: "Subscription Overview",
      template: "Show all my subscriptions",
      description: "List of active subscriptions",
      icon: PieChartIcon,
    },
    {
      id: "sub-track",
      label: "Track Spending",
      template: "Track monthly subscription costs",
      description: "Analyze subscription spending",
      icon: TrendingUpIcon,
    },
    {
      id: "sub-cancel",
      label: "Cancel Service",
      template: "Help me cancel a subscription",
      description: "Identify and cancel unused subs",
      icon: XIcon,
    },
    {
      id: "sub-alerts",
      label: "Renewal Alerts",
      template: "Set up renewal reminders",
      description: "Get notified before renewals",
      icon: BellIcon,
    },
  ],
};

// Refined animation variants with better easing
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
  },
};

export interface CryptoQuickActionsProps {
  /** Currently selected action - when set, shows sub-suggestions */
  selectedAction: CryptoActionId | null;
  /** Called when user selects a main action */
  onActionSelect: (action: CryptoActionId) => void;
  /** Called when user selects a sub-suggestion with its template */
  onSubSuggestionSelect: (template: string) => void;
  /** Called when user closes/clears the current action */
  onClearAction: () => void;
  className?: string;
}

export function CryptoQuickActions({
  selectedAction,
  onActionSelect,
  onSubSuggestionSelect,
  onClearAction,
  className,
}: CryptoQuickActionsProps) {
  const subSuggestions = useMemo(() => {
    if (!selectedAction) {
      return [];
    }
    return CRYPTO_SUB_SUGGESTIONS[selectedAction];
  }, [selectedAction]);

  const selectedActionData = useMemo(() => {
    if (!selectedAction) {
      return null;
    }
    return CRYPTO_ACTIONS.find((a) => a.id === selectedAction) ?? null;
  }, [selectedAction]);

  // Show sub-suggestions mode
  if (selectedAction && selectedActionData) {
    return (
      <motion.div
        animate="visible"
        className={cn(
          "mx-auto flex w-full max-w-md flex-col items-center gap-3 pt-4",
          className
        )}
        data-testid="crypto-sub-suggestions"
        exit="exit"
        initial="hidden"
        variants={containerVariants}
      >
        {/* Header with selected action info */}
        <motion.div
          className="flex w-full items-center justify-between px-1"
          variants={itemVariants}
        >
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: 0, scale: 1 }}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground"
              initial={{ rotate: -10, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <selectedActionData.icon size={16} />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">
                {selectedActionData.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {selectedActionData.subDescription}
              </span>
            </div>
          </div>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="h-7 w-7 rounded-full p-0 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                  onClick={onClearAction}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  <XIcon size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">Back to actions</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </motion.div>

        {/* Enhanced sub-suggestion cards */}
        <motion.div
          className="grid w-full grid-cols-1 gap-2"
          variants={containerVariants}
        >
          <AnimatePresence mode="popLayout">
            {subSuggestions.map((suggestion, index) => (
              <motion.button
                className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-border/60 bg-background p-3 text-left transition-all hover:border-border hover:bg-accent/50 hover:shadow-sm"
                custom={index}
                key={suggestion.id}
                onClick={() => onSubSuggestionSelect(suggestion.template)}
                type="button"
                variants={cardVariants}
                whileHover={{ x: 3, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.99 }}
              >
                {/* Icon container with subtle background */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-background">
                  <suggestion.icon
                    className="text-muted-foreground transition-colors group-hover:text-foreground"
                    size={18}
                  />
                </div>

                {/* Text content */}
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-sm font-medium text-foreground">
                    {suggestion.label}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {suggestion.description}
                  </span>
                </div>

                {/* Arrow indicator */}
                <ChevronRightIcon
                  className="shrink-0 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-muted-foreground"
                  size={16}
                />

                {/* Subtle gradient overlay on hover */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-muted/20 opacity-0 transition-opacity group-hover:opacity-100" />
              </motion.button>
            ))}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    );
  }

  // Show main actions mode - SINGLE LINE
  return (
    <TooltipProvider delayDuration={200}>
      <motion.div
        animate="visible"
        className={cn(
          "flex flex-wrap items-center justify-center gap-2 pt-3",
          className
        )}
        data-testid="crypto-quick-actions"
        exit="exit"
        initial="hidden"
        variants={containerVariants}
      >
        {CRYPTO_ACTIONS.map((action) => (
          <Tooltip key={action.id}>
            <TooltipTrigger asChild>
              <motion.div variants={itemVariants}>
                <motion.button
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-border bg-background px-4 py-2.5 text-sm text-muted-foreground transition-all hover:border-muted-foreground/30 hover:bg-accent/50 hover:text-foreground hover:shadow-sm"
                  onClick={() => onActionSelect(action.id)}
                  type="button"
                  whileHover={{ y: -2, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.97 }}
                >
                  {/* Icon */}
                  <motion.div
                    className="text-muted-foreground transition-colors duration-200"
                    transition={{ type: "spring", stiffness: 300 }}
                    whileHover={{ scale: 1.1 }}
                  >
                    <action.icon size={16} />
                  </motion.div>

                  <span className="font-medium">{action.label}</span>

                  {/* Badge */}
                  {action.badge && (
                    <span className="ml-0.5 rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
                      {action.badge}
                    </span>
                  )}

                  {/* Subtle hover glow effect */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-muted/10 opacity-0 transition-opacity group-hover:opacity-100" />
                </motion.button>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent className="max-w-[200px]" side="top" sideOffset={8}>
              <div className="space-y-1">
                <p className="font-medium">{action.label}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {action.description}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </motion.div>
    </TooltipProvider>
  );
}
