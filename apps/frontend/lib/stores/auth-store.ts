import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { User } from "@/lib/types/auth";

interface AuthStore {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  initializeGuest: () => void;
  setAccountId: (accountId: string) => void;
}

const GUEST_STORAGE_KEY = "ulejra-guest-id";
const AUTH_STORAGE_KEY = "ulejra-auth";

function getOrCreateGuestId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const existing = localStorage.getItem(GUEST_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const newId = `guest-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  localStorage.setItem(GUEST_STORAGE_KEY, newId);
  return newId;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      setAuth: (user: User, token: string) => {
        set({ user, token });
      },

      clearAuth: () => {
        fetch("/api/auth/cookie", { method: "DELETE" }).catch(() => undefined);
        if (typeof window !== "undefined") {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          const guestId = getOrCreateGuestId();
          set({
            user: {
              id: guestId,
              type: "guest",
            },
            token: null,
          });
        } else {
          set({ user: null, token: null });
        }
      },

      initializeGuest: () => {
        const { user, token } = get();
        if (!user && !token) {
          const guestId = getOrCreateGuestId();
          set({
            user: {
              id: guestId,
              type: "guest",
            },
            token: null,
          });
        }
      },

      setAccountId: (accountId: string) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, accountId } });
        }
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
);

export function getStoredAuth() {
  if (typeof window === "undefined") {
    return { user: null, token: null };
  }

  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        user: parsed.state?.user || null,
        token: parsed.state?.token || null,
      };
    }
  } catch {
    // Ignore parse errors
  }

  return { user: null, token: null };
}
