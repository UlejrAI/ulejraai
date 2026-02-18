"use client";

import {
  ArrowLeftRightIcon,
  ArrowUpDownIcon,
  ChevronDownIcon,
  CopyIcon,
  DownloadIcon,
  MoonIcon,
  SendIcon,
  SunIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/lib/stores/auth-store";

function SendForm({ accountId }: { accountId?: string }) {
  const { user } = useAuthStore();
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [assetId, setAssetId] = useState("leo");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<
    { account_id: string; full_name: string; random_account_number: string }[]
  >([]);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);

  const ASSET_ID_MAP: Record<string, string> = {
    leo: "leo#saloneledger",
    usd: "usd#saloneledger",
  };

  useEffect(() => {
    if (accountId) {
      setFromAccountId(accountId);
    }
  }, [accountId]);

  useEffect(() => {
    if (!accountId && user?.accountNumber) {
      setIsFetchingUsers(true);
      const fetchData = async () => {
        try {
          const response = await fetch("/api/iroha-service/wallet");
          const data = await response.json();
          const wallets = data.data?.data || [];
          const matchedWallet = wallets.find(
            (w: { random_account_number: string }) =>
              w.random_account_number === user.accountNumber
          );
          if (matchedWallet?.account_id) {
            setFromAccountId(matchedWallet.account_id);
          }
          setUsers(wallets);
        } catch {
          toast.error("Failed to fetch users");
        } finally {
          setIsFetchingUsers(false);
        }
      };
      fetchData();
    } else if (accountId && users.length === 0) {
      setIsFetchingUsers(true);
      const fetchUsers = async () => {
        try {
          const response = await fetch("/api/iroha-service/wallet");
          const data = await response.json();
          const wallets = data.data?.data || [];
          setUsers(wallets);
        } catch {
          toast.error("Failed to fetch users");
        } finally {
          setIsFetchingUsers(false);
        }
      };
      fetchUsers();
    }
  }, [accountId, user?.accountNumber, users.length]);

  const handleSubmit = async () => {
    if (!fromAccountId || !toAccountId || !assetId || !amount) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/iroha-service/wallet/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromAccountId,
          toAccountId,
          assetId: ASSET_ID_MAP[assetId],
          amount: Number.parseFloat(amount),
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Successfully sent ${amount} ${assetId.toUpperCase()}`);
        setToAccountId("");
        setAssetId("leo");
        setAmount("");
      } else {
        toast.error(data.error || "Transfer failed");
      }
    } catch {
      toast.error("Failed to transfer");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => u.account_id !== fromAccountId);

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="from-account">From</Label>
        <Input
          disabled
          id="from-account"
          value={fromAccountId || (isFetchingUsers ? "Loading..." : "")}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="to-account">To</Label>
        <Select
          disabled={isFetchingUsers}
          onValueChange={setToAccountId}
          value={toAccountId}
        >
          <SelectTrigger id="to-account">
            <SelectValue placeholder="Select recipient" />
          </SelectTrigger>
          <SelectContent>
            {filteredUsers.map((u) => (
              <SelectItem key={u.account_id} value={u.account_id}>
                {u.full_name} ({u.random_account_number})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="send-asset">Asset</Label>
        <Select onValueChange={setAssetId} value={assetId}>
          <SelectTrigger id="send-asset">
            <SelectValue placeholder="Select asset" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="leo">LEO</SelectItem>
            <SelectItem value="usd">USD</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="send-amount">Amount</Label>
        <Input
          id="send-amount"
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          type="number"
          value={amount}
        />
      </div>
      <Button disabled={isLoading} onClick={handleSubmit} type="button">
        {isLoading ? "Sending..." : "Send"}
      </Button>
    </div>
  );
}

function SetBalanceForm({ accountId }: { accountId?: string }) {
  const { user } = useAuthStore();
  const [userAccountId, setUserAccountId] = useState("");
  const [assetId, setAssetId] = useState("leo");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingWallet, setIsFetchingWallet] = useState(false);

  const ASSET_ID_MAP: Record<string, string> = {
    leo: "leo#saloneledger",
    usd: "usd#saloneledger",
  };

  useEffect(() => {
    if (accountId) {
      setUserAccountId(accountId);
    }
  }, [accountId]);

  useEffect(() => {
    if (!accountId && user?.accountNumber) {
      setIsFetchingWallet(true);
      const fetchWallet = async () => {
        try {
          const response = await fetch("/api/iroha-service/wallet");
          const data = await response.json();
          const wallets = data.data?.data || [];
          const matchedWallet = wallets.find(
            (w: { random_account_number: string }) =>
              w.random_account_number === user.accountNumber
          );
          if (matchedWallet?.account_id) {
            setUserAccountId(matchedWallet.account_id);
          }
        } catch {
          toast.error("Failed to fetch wallet info");
        } finally {
          setIsFetchingWallet(false);
        }
      };
      fetchWallet();
    }
  }, [accountId, user?.accountNumber]);

  const handleSubmit = async () => {
    if (!userAccountId || !assetId || !amount) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/iroha-service/wallet/set-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAccountId,
          assetId: ASSET_ID_MAP[assetId],
          amount: Number.parseFloat(amount),
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Balance set successfully");
        setAssetId("leo");
        setAmount("");
      } else {
        toast.error(data.error || "Failed to set balance");
      }
    } catch {
      toast.error("Failed to set balance");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="user-account-id">User Account ID</Label>
        <Input
          disabled={isFetchingWallet}
          id="user-account-id"
          onChange={(e) => setUserAccountId(e.target.value)}
          placeholder={isFetchingWallet ? "Loading..." : "account@domain"}
          value={userAccountId}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="asset-id">Asset</Label>
        <Select onValueChange={setAssetId} value={assetId}>
          <SelectTrigger id="asset-id">
            <SelectValue placeholder="Select asset" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="leo">LEO</SelectItem>
            <SelectItem value="usd">USD</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="req-amount">Amount</Label>
        <Input
          id="req-amount"
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          type="number"
          value={amount}
        />
      </div>
      <Button disabled={isLoading} onClick={handleSubmit} type="button">
        {isLoading ? "Setting..." : "Set Balance"}
      </Button>
    </div>
  );
}

function ReceiveForm() {
  const [walletAddress, setWalletAddress] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const response = await fetch("/api/iroha-service/wallet");
        const data = await response.json();
        if (data.wallets?.[0]?.accountId) {
          setWalletAddress(data.wallets[0].accountId);
        }
      } catch {
        toast.error("Failed to fetch wallet address");
      } finally {
        setIsLoading(false);
      }
    };
    fetchWallet();
  }, []);

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast.success("Address copied to clipboard");
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label>Your Wallet Address</Label>
        <div className="flex gap-2">
          <Input
            placeholder={isLoading ? "Loading..." : "No wallet found"}
            readOnly
            value={walletAddress}
          />
          <Button
            onClick={copyAddress}
            size="icon"
            type="button"
            variant="outline"
          >
            <CopyIcon className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ConvertForm() {
  const [fromAsset, setFromAsset] = useState("");
  const [toAsset, setToAsset] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!fromAsset || !toAsset || !amount) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/iroha-service/wallet/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: fromAsset,
          to: toAsset,
          amount,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(
          `Successfully converted ${amount} ${fromAsset} to ${toAsset}`
        );
        setFromAsset("");
        setToAsset("");
        setAmount("");
      } else {
        toast.error(data.error || "Conversion failed");
      }
    } catch {
      toast.error("Failed to convert");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="from-asset">From</Label>
        <Input
          id="from-asset"
          onChange={(e) => setFromAsset(e.target.value)}
          placeholder="e.g., xox, usdc"
          value={fromAsset}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="to-asset">To</Label>
        <Input
          id="to-asset"
          onChange={(e) => setToAsset(e.target.value)}
          placeholder="e.g., usdc, xox"
          value={toAsset}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="convert-amount">Amount</Label>
        <Input
          id="convert-amount"
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          type="number"
          value={amount}
        />
      </div>
      <Button disabled={isLoading} onClick={handleSubmit} type="button">
        {isLoading ? "Converting..." : "Convert"}
      </Button>
    </div>
  );
}

export default function SettingsPage() {
  const { resolvedTheme, setTheme } = useTheme();
  const { user, token, setAccountId } = useAuthStore();
  const [sendOpen, setSendOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [stablecoinOpen, setStablecoinOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);

  useEffect(() => {
    const fetchWalletAccountId = async () => {
      console.log("user?.accountId:", user?.accountId);
      console.log("user?.accountNumber:", user?.accountNumber);
      console.log("token:", !!token);
      if (!user?.accountId && token && user?.accountNumber) {
        try {
          const response = await fetch("/api/iroha-service/wallet");
          const data = await response.json();
          console.log("wallet data:", data);
          const wallets = data.data?.data || [];
          console.log("wallets:", wallets);
          const matchedWallet = wallets.find(
            (w: { random_account_number: string }) =>
              w.random_account_number === user.accountNumber
          );
          console.log("matchedWallet:", matchedWallet);
          if (matchedWallet?.account_id) {
            console.log("setting accountId:", matchedWallet.account_id);
            setAccountId(matchedWallet.account_id);
          }
        } catch (error) {
          console.error("Failed to fetch wallet:", error);
        }
      }
    };
    fetchWalletAccountId();
  }, [token, user?.accountId, user?.accountNumber, setAccountId]);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <div className="container mx-auto max-w-2xl space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your wallet and preferences
        </p>
      </div>

      <div className="space-y-2">
        <Collapsible onOpenChange={setSendOpen} open={sendOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border bg-background px-4 py-3 text-left hover:bg-accent">
            <div className="flex items-center gap-3">
              <SendIcon className="size-5" />
              <div>
                <p className="font-medium">Send</p>
                <p className="text-sm text-muted-foreground">
                  Send crypto to others
                </p>
              </div>
            </div>
            <ChevronDownIcon
              className={`size-5 transition-transform ${sendOpen ? "rotate-180" : ""}`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 rounded-lg border border-t-0 bg-background p-4">
            <SendForm accountId={user?.accountId} />
          </CollapsibleContent>
        </Collapsible>

        <Collapsible onOpenChange={setRequestOpen} open={requestOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border bg-background px-4 py-3 text-left hover:bg-accent">
            <div className="flex items-center gap-3">
              <ArrowUpDownIcon className="size-5" />
              <div>
                <p className="font-medium">Set Balance</p>
                <p className="text-sm text-muted-foreground">
                  Set or update your wallet balance
                </p>
              </div>
            </div>
            <ChevronDownIcon
              className={`size-5 transition-transform ${requestOpen ? "rotate-180" : ""}`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 rounded-lg border border-t-0 bg-background p-4">
            <SetBalanceForm accountId={user?.accountId} />
          </CollapsibleContent>
        </Collapsible>

        <Collapsible onOpenChange={setReceiveOpen} open={receiveOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border bg-background px-4 py-3 text-left hover:bg-accent">
            <div className="flex items-center gap-3">
              <DownloadIcon className="size-5" />
              <div>
                <p className="font-medium">Receive</p>
                <p className="text-sm text-muted-foreground">
                  Get your wallet address
                </p>
              </div>
            </div>
            <ChevronDownIcon
              className={`size-5 transition-transform ${receiveOpen ? "rotate-180" : ""}`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 rounded-lg border border-t-0 bg-background p-4">
            <ReceiveForm />
          </CollapsibleContent>
        </Collapsible>

        {/*<Collapsible onOpenChange={setStablecoinOpen} open={stablecoinOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border bg-background px-4 py-3 text-left hover:bg-accent">
            <div className="flex items-center gap-3">
              <SendIcon className="size-5" />
              <div>
                <p className="font-medium">Send Stablecoin</p>
                <p className="text-sm text-muted-foreground">
                  Send USDC, USDT, DAI
                </p>
              </div>
            </div>
            <ChevronDownIcon
              className={`size-5 transition-transform ${stablecoinOpen ? "rotate-180" : ""}`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 rounded-lg border border-t-0 bg-background p-4">
            <SendForm accountId={user?.accountId} />
          </CollapsibleContent>
        </Collapsible>*/}

        <Collapsible onOpenChange={setConvertOpen} open={convertOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border bg-background px-4 py-3 text-left hover:bg-accent">
            <div className="flex items-center gap-3">
              <ArrowLeftRightIcon className="size-5" />
              <div>
                <p className="font-medium">Convert</p>
                <p className="text-sm text-muted-foreground">
                  Swap between assets
                </p>
              </div>
            </div>
            <ChevronDownIcon
              className={`size-5 transition-transform ${convertOpen ? "rotate-180" : ""}`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 rounded-lg border border-t-0 bg-background p-4">
            <ConvertForm />
          </CollapsibleContent>
        </Collapsible>

        <div className="flex items-center justify-between rounded-lg border bg-background px-4 py-3">
          <div className="flex items-center gap-3">
            {resolvedTheme === "dark" ? (
              <SunIcon className="size-5" />
            ) : (
              <MoonIcon className="size-5" />
            )}
            <div>
              <p className="font-medium">Theme</p>
              <p className="text-sm text-muted-foreground">
                Current: {resolvedTheme === "dark" ? "Dark" : "Light"} mode
              </p>
            </div>
          </div>
          <Button onClick={toggleTheme} type="button" variant="outline">
            Switch to {resolvedTheme === "dark" ? "Light" : "Dark"}
          </Button>
        </div>
      </div>
    </div>
  );
}
