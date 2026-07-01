import { QueryClient } from "@tanstack/react-query";
import { SocialProviderError } from "@/providers/SocialProvider";

/**
 * Shared React Query client. Tuned for the Wax speed promise (docs/SPRINT.md §3.1):
 * cached views feel instant and we avoid needless refetches.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // 1 min — cached feed/profile shows instantly
      gcTime: 30 * 60_000, // keep cache 30 min
      // Don't retry a rejected/expired session: it can't succeed and hammering
      // a flagged account raises ban risk (docs/SPRINT.md §1). Retry only
      // transient failures, and back off so we never burst (§1 pacing).
      retry: (failureCount, error) => {
        if (
          error instanceof SocialProviderError &&
          (error.code === "auth_failed" || error.code === "account_flagged")
        ) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      refetchOnWindowFocus: false,
    },
  },
});
