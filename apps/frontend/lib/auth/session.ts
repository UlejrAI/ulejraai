import { cookies } from "next/headers";
import type { User } from "@/lib/types/auth";

interface Session {
  user: User;
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return null;
  }

  return {
    user: {
      id: "",
      type: "wallet",
    },
  };
}

export async function getAuthUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = token.split(".")[1];
    if (!payload) {
      return null;
    }

    const decoded = JSON.parse(atob(payload));

    return {
      id: decoded.user_id || decoded.userId || "",
      type: decoded.role === "user" ? "wallet" : "guest",
      email: decoded.email,
      companyId: decoded.company_id || decoded.companyId,
    };
  } catch {
    return null;
  }
}

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("auth_token")?.value || null;
}

export function isGuestUser(user: User | null): boolean {
  if (!user) {
    return true;
  }
  return user.type === "guest";
}
