export type UserType = "guest" | "wallet";

export interface User {
  id: string;
  type: UserType;
  fullName?: string;
  companyId?: string;
  accountNumber?: string;
  accountId?: string;
  email?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
