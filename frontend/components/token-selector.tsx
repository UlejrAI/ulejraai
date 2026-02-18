"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTokenStore } from "@/lib/stores/token-store";

export function TokenSelector() {
  const { selectedToken, setSelectedToken } = useTokenStore();

  return (
    <Select
      onValueChange={(value) => setSelectedToken(value as "SAL" | "USD")}
      value={selectedToken}
    >
      <SelectTrigger className="h-8 w-20 justify-between rounded-xl border border-border bg-background px-3 text-sm">
        <SelectValue />
        {/*<ChevronDown className="h-4 w-4 opacity-50" />*/}
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="SAL">SAL</SelectItem>
        <SelectItem value="USD">USD</SelectItem>
      </SelectContent>
    </Select>
  );
}
