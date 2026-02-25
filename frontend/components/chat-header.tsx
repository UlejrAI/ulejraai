"use client";

import { WalletMinimalIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { memo, useCallback, useEffect, useState } from "react";
import { useWindowSize } from "usehooks-ts";
import { saveChatModelAsCookie } from "@/app/(chat)/actions";
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import { SidebarToggle } from "@/components/sidebar-toggle";
import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { chatModels } from "@/lib/ai/models";
import { useAuthStore } from "@/lib/stores/auth-store";
import { cn } from "@/lib/utils";
import { PlusIcon } from "./icons";
import { useSidebar } from "./ui/sidebar";
import type { VisibilityType } from "./visibility-selector";

type CompanyOption = {
  id: string;
  name: string;
};

const generateAccountNumber = () => {
  const charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const randomValues = crypto.getRandomValues(new Uint8Array(8));

  const randomString = Array.from(randomValues)
    .map((value) => charset[value % charset.length])
    .join("");

  return `S-${randomString}`;
};

function PureChatHeader({
  chatId: _chatId,
  selectedVisibilityType: _selectedVisibilityType,
  isReadonly: _isReadonly,
  selectedModelId,
  onModelChange,
}: {
  chatId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
}) {
  const router = useRouter();
  const { open } = useSidebar();
  const { user, token, setAuth } = useAuthStore();

  const isWalletConnected = user?.type === "wallet" && !!token;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const selectedModel =
    chatModels.find((m) => m.id === selectedModelId) ?? chatModels[0];
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [isCompaniesLoading, setIsCompaniesLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [nin, setNin] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { width: windowWidth } = useWindowSize();
  const requiredFieldsFilled = Boolean(
    fullName && companyId && accountNumber && nin
  );
  const [walletError, setWalletError] = useState<string | null>(null);
  const [isRetryingWallet, setIsRetryingWallet] = useState(false);

  const handleFetchCompanies = useCallback(async () => {
    setIsCompaniesLoading(true);

    try {
      const response = await fetch("/api/companies/list");

      if (!response.ok) {
        throw new Error("Failed to load organisations.");
      }

      const data = await response.json();
      const list: unknown[] = Array.isArray(data.companies)
        ? data.companies
        : Array.isArray(data)
          ? data
          : [];

      const normalizedCompanies = list.filter((item): item is CompanyOption => {
        if (!item || typeof item !== "object") {
          return false;
        }

        const typedItem = item as { id?: unknown; name?: unknown };

        return (
          typeof typedItem.id === "string" && typeof typedItem.name === "string"
        );
      });

      setCompanies(
        normalizedCompanies.sort((a, b) => a.name.localeCompare(b.name))
      );
    } catch (error) {
      console.error("Failed to fetch organisations:", error);
      setCompanies([]);
    } finally {
      setIsCompaniesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (dialogOpen && companies.length === 0 && !isCompaniesLoading) {
      handleFetchCompanies();
    }
  }, [companies.length, dialogOpen, handleFetchCompanies, isCompaniesLoading]);

  useEffect(() => {
    if (dialogOpen) {
      setAccountNumber(generateAccountNumber());
    }
  }, [dialogOpen]);

  const handleCreateAccount = useCallback(async () => {
    if (!requiredFieldsFilled || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setWalletError(null);

    try {
      const response = await fetch("/api/auth/signup_wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName,
          company_id: companyId,
          company_name: companies.find((c) => c.id === companyId)?.name || "",
          account_number: accountNumber,
          nidc: nin,
          phone: mobileNumber,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(
          payload?.message ?? "Unable to submit the wallet request."
        );
      }

      const data = await response.json();

      if (data.success && data.token && data.user) {
        setAuth(
          {
            id: data.user.id,
            type: "wallet",
            fullName,
            companyId,
            accountNumber,
            accountId: data.wallet?.accountId,
          },
          data.token
        );

        await fetch("/api/auth/cookie", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: data.token }),
        });

        if (data.walletError) {
          setWalletError(data.walletError);
          toast({
            type: "success",
            description:
              "Account created. Wallet creation failed. Please retry.",
          });
        } else {
          toast({
            type: "success",
            description: "Your wallet has been connected successfully.",
          });

          setFullName("");
          setCompanyId("");
          setAccountNumber("");
          setNin("");
          setMobileNumber("");
          setDialogOpen(false);
        }

        router.refresh();
      }
    } catch (error) {
      console.error("Failed to submit signup wallet request:", error);
      toast({
        type: "error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to submit the wallet request.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    accountNumber,
    companies,
    companyId,
    fullName,
    isSubmitting,
    mobileNumber,
    nin,
    requiredFieldsFilled,
    router,
    setAuth,
  ]);

  const handleRetryWallet = useCallback(async () => {
    const { user, token } = useAuthStore.getState();

    if (!user || !token) {
      toast({
        type: "error",
        description: "Please sign up again to retry wallet creation.",
      });
      return;
    }

    setIsRetryingWallet(true);

    try {
      const response = await fetch("/api/auth/retry-wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          orgId: user.companyId,
          full_name: user.fullName,
          phone: mobileNumber || undefined,
          account_number: user.accountNumber,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setWalletError(null);
        toast({
          type: "success",
          description: "Wallet created successfully!",
        });
      } else {
        throw new Error(data.error || "Failed to create wallet");
      }
    } catch (error) {
      console.error("Failed to retry wallet creation:", error);
      toast({
        type: "error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create wallet. Please try again.",
      });
    } finally {
      setIsRetryingWallet(false);
    }
  }, [mobileNumber]);

  return (
    <header className="sticky top-0 flex items-center gap-2 bg-background px-2 py-1.5 md:px-2 rounded-[inherit]">
      <SidebarToggle />

      {(!open || windowWidth < 768) && (
        <Button
          className="order-2 h-8 px-2 md:order-1 md:h-fit md:px-2"
          onClick={() => {
            router.push("/");
            router.refresh();
          }}
          variant="outline"
        >
          <PlusIcon />
          <span className="md:sr-only">New Chat</span>
        </Button>
      )}

      {/* MODEL SELECTOR */}
      <ModelSelector
        onOpenChange={setModelSelectorOpen}
        open={modelSelectorOpen}
      >
        <ModelSelectorTrigger asChild>
          <Button
            className={cn(
              "order-2 gap-2 px-3",
              !open || windowWidth < 768 ? "" : "ml-auto"
            )}
            variant="ghost"
          >
            <ModelSelectorLogo provider={selectedModel.provider} />
            <span className="hidden text-sm sm:inline">
              {selectedModel.name}
            </span>
          </Button>
        </ModelSelectorTrigger>
        <ModelSelectorContent title="Select Model">
          <ModelSelectorInput placeholder="Search models..." />
          <ModelSelectorList>
            <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
            <ModelSelectorGroup heading="Models">
              {chatModels.map((model) => (
                <ModelSelectorItem
                  key={model.id}
                  onSelect={() => {
                    onModelChange(model.id);
                    setModelSelectorOpen(false);
                    saveChatModelAsCookie(model.id);
                  }}
                  value={model.id}
                >
                  <div className="flex items-center gap-2">
                    <ModelSelectorLogo provider={model.provider} />
                    <div className="flex flex-col">
                      <ModelSelectorName>{model.name}</ModelSelectorName>
                      <span className="text-xs text-muted-foreground">
                        {model.description}
                      </span>
                    </div>
                  </div>
                  {model.id === selectedModelId && (
                    <span className="ml-auto text-xs text-primary">✓</span>
                  )}
                </ModelSelectorItem>
              ))}
            </ModelSelectorGroup>
          </ModelSelectorList>
        </ModelSelectorContent>
      </ModelSelector>

      <Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
        {isWalletConnected ? (
          <Button className="order-3 ml-auto rounded-full py-1.5" disabled>
            <WalletMinimalIcon className="size-4" />
            Connected
          </Button>
        ) : (
          <DialogTrigger asChild>
            <Button className="order-3 ml-auto rounded-full py-1.5">
              <WalletMinimalIcon className="size-4" />
              Connect Wallet
            </Button>
          </DialogTrigger>
        )}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Wallet Signup</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Enter your full name"
                value={fullName}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="organisation">Organisation</Label>
              <Select onValueChange={setCompanyId} value={companyId}>
                <SelectTrigger
                  aria-label="Select organisation"
                  disabled={isCompaniesLoading}
                >
                  <SelectValue placeholder="Select organisation" />
                </SelectTrigger>
                <SelectContent>
                  {companies.length > 0 ? (
                    companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem disabled value="__no-organisations">
                      {isCompaniesLoading
                        ? "Loading organisations..."
                        : "No organisations available"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                onChange={(event) => setAccountNumber(event.target.value)}
                placeholder="Enter account number"
                value={accountNumber}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nin">National Identification Number (NIN)</Label>
              <Input
                id="nin"
                onChange={(event) => setNin(event.target.value)}
                placeholder="Enter NIN"
                value={nin}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mobileNumber">Mobile Number</Label>
              <Input
                id="mobileNumber"
                onChange={(event) => setMobileNumber(event.target.value)}
                placeholder="Enter mobile number"
                value={mobileNumber}
              />
            </div>
            <Button
              className="mt-2"
              disabled={!requiredFieldsFilled || isSubmitting}
              onClick={handleCreateAccount}
              type="button"
            >
              {isSubmitting ? "Submitting..." : "Create Account"}
            </Button>
            {walletError && (
              <Button
                className="mt-2"
                disabled={isRetryingWallet}
                onClick={handleRetryWallet}
                type="button"
                variant="outline"
              >
                {isRetryingWallet ? "Retrying..." : "Retry Wallet Creation"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return (
    prevProps.chatId === nextProps.chatId &&
    prevProps.selectedVisibilityType === nextProps.selectedVisibilityType &&
    prevProps.isReadonly === nextProps.isReadonly &&
    prevProps.selectedModelId === nextProps.selectedModelId
  );
});
