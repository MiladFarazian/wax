import { QueryClient } from "@tanstack/react-query";

/**
 * Shared React Query client. Tuned for the Wax speed promise (docs/SPRINT.md §3.1):
 * cached views feel instant and we avoid needless refetches.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // 1 min — cached feed/profile shows instantly
      gcTime: 30 * 60_000, // keep cache 30 min
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});
