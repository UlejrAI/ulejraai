import type { UserType } from "@/lib/types/auth";

type Entitlements = {
  maxMessagesPerDay: number;
};

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  guest: {
    maxMessagesPerDay: 100,
  },
  wallet: {
    maxMessagesPerDay: 50,
  },
};
