"use client";

import { useEffect, useMemo } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { User } from "@/lib/types/auth";

export function useAuth() {
  const { user, token, setAuth, clearAuth, initializeGuest } = useAuthStore();

  useEffect(() => {
    if (typeof window !== "undefined") {
      initializeGuest();
    }
  }, [initializeGuest]);

  const isAuthenticated = useMemo(
    () => token !== null && user !== null,
    [token, user]
  );

  const isGuest = useMemo(() => user?.type === "guest", [user?.type]);

  const isWallet = useMemo(() => user?.type === "wallet", [user?.type]);

  return {
    user,
    token,
    isAuthenticated,
    isGuest,
    isWallet,
    setAuth,
    clearAuth,
    initializeGuest,
  };
}

export function useUser(): User | null {
  const { user } = useAuthStore();
  return user;
}
