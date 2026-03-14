/**
 * Custom useAuth hook for tatt-ooo's self-contained email/password auth.
 * Replaces Manus OAuth dependency for Railway deployment.
 */
import { trpc } from "@/lib/trpc";
import { useCallback } from "react";

export function useAuth() {
  const { data: user, isLoading, refetch } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      refetch();
      window.location.href = "/";
    },
  });

  const logout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  return {
    user: user ?? null,
    loading: isLoading,
    isAuthenticated: !!user,
    logout,
    refetch,
  };
}
