import type { ToolSet } from "ai";
import { detectIrohaIntent } from "./intent-detector";

const ALWAYS_ACTIVE = [
  "getBalance",
  "getWalletInfo",
  "getNotifications",
  "getUserInfo",
] as const;

export function getActiveTools(_allTools: ToolSet, message: string): string[] {
  const intentTools = detectIrohaIntent(message);

  const activeTools = new Set([...ALWAYS_ACTIVE, ...intentTools]);

  return Array.from(activeTools);
}
