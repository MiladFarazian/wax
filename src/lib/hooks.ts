/**
 * Data hooks — the UI's only door to data. Each wraps the active SocialProvider
 * behind React Query so caching, pagination, and optimistic updates are uniform.
 */

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { getProvider } from "@/providers";
import type { ID, Page, Post } from "@/types/social";

export function useFeed() {
  return useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: ({ pageParam }) => getProvider().getFeed(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: Page<Post>) => last.nextCursor,
  });
}

export function useStoryTrays() {
  return useQuery({
    queryKey: ["stories"],
    queryFn: () => getProvider().getStoryTrays(),
  });
}

export function useProfile(userId: ID) {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: () => getProvider().getProfile(userId),
  });
}

export function useConversations() {
  return useInfiniteQuery({
    queryKey: ["conversations"],
    queryFn: ({ pageParam }) => getProvider().getConversations(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor,
  });
}

/**
 * Optimistic like toggle — reflects instantly, reconciles in the background.
 * This is the §3.1 "optimistic UI" promise made concrete.
 */
export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, like }: { postId: ID; like: boolean }) =>
      getProvider().setLike(postId, like),
    onMutate: async ({ postId, like }) => {
      await qc.cancelQueries({ queryKey: ["feed"] });
      const prev = qc.getQueryData(["feed"]);
      qc.setQueryData(["feed"], (data: any) => {
        if (!data) return data;
        return {
          ...data,
          pages: data.pages.map((page: Page<Post>) => ({
            ...page,
            items: page.items.map((p) =>
              p.id === postId
                ? { ...p, likedByMe: like, likeCount: p.likeCount + (like ? 1 : -1) }
                : p,
            ),
          })),
        };
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["feed"], ctx.prev);
    },
  });
}
