import { create } from "zustand";

type Token = "SAL" | "USD";

interface TokenStore {
  selectedToken: Token;
  setSelectedToken: (token: Token) => void;
}

export const useTokenStore = create<TokenStore>((set) => ({
  selectedToken: "SAL",
  setSelectedToken: (token) => set({ selectedToken: token }),
}));
