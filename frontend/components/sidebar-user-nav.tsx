"use client";

import { ChevronUp } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { User } from "@/lib/types/auth";

export function SidebarUserNav({ user }: { user: User | null | undefined }) {
  const router = useRouter();
  const { user: storeUser, clearAuth } = useAuthStore();
  const { setTheme, resolvedTheme } = useTheme();

  // Client-side Zustand state takes precedence to avoid race condition
  // where server still sees the old session after cookie deletion
  const isGuest =
    storeUser?.type === "guest" ||
    !storeUser ||
    user?.type === "guest" ||
    !user;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className="h-10 bg-background border border-border data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              data-testid="user-nav-button"
            >
              <Image
                alt={user?.email ?? user?.fullName ?? "User Avatar"}
                className="rounded-full"
                height={24}
                src={`https://avatar.vercel.sh/${user?.email ?? user?.fullName ?? "user"}`}
                width={24}
              />
              <span className="truncate" data-testid="user-email">
                {isGuest ? "Guest" : (user?.fullName ?? user?.email ?? "User")}
              </span>
              <ChevronUp className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-popper-anchor-width)"
            data-testid="user-nav-menu"
            side="top"
          >
            <DropdownMenuItem
              className="cursor-pointer"
              data-testid="user-nav-item-theme"
              onSelect={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
            >
              {`Toggle ${resolvedTheme === "light" ? "dark" : "light"} mode`}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild data-testid="user-nav-item-auth">
              <button
                className="w-full cursor-pointer"
                onClick={async () => {
                  if (isGuest) {
                    router.push("/login");
                  } else {
                    await fetch("/api/auth/cookie", { method: "DELETE" });
                    clearAuth();
                    router.push("/login");
                    router.refresh();
                  }
                }}
                type="button"
              >
                {isGuest ? "Login to your account" : "Sign out"}
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
