import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/stores/auth-store";

export const SignOutForm = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const handleSignOut = () => {
    startTransition(async () => {
      try {
        await fetch("/api/auth/cookie", {
          method: "DELETE",
        });

        clearAuth();

        router.refresh();
        router.push("/");
      } catch {
        console.error("Failed to sign out");
      }
    });
  };

  return (
    <Button
      className="w-full px-1 py-0.5 text-left text-red-500"
      disabled={isPending}
      onClick={handleSignOut}
      type="button"
      variant="ghost"
    >
      {isPending ? "Signing out..." : "Sign out"}
    </Button>
  );
};
