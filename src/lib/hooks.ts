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
import type {
  Comment,
  CreatePostInput,
  DirectMessage,
  ID,
  Notification,
  Page,
  Post,
} from "@/types/social";

export function useFeed() {
  return useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: ({ pageParam }) => getProvider().getFeed(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: Page<Post>) => last.nextCursor,
  });
}

/** A specific user's posts (their profile grid). Disabled until we have an id. */
export function useUserPosts(userId?: ID) {
  return useInfiniteQuery({
    queryKey: ["userPosts", userId],
    enabled: !!userId,
    queryFn: ({ pageParam }) => getProvider().getUserPosts(userId as ID, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: Page<Post>) => last.nextCursor,
  });
}

/** Live user search (debounce upstream by keeping the query stable). */
export function useSearch(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: ["search", q],
    enabled: q.length > 0,
    queryFn: () => getProvider().searchUsers(q),
    staleTime: 30_000,
  });
}

/** Create a post; on success prepends it to the cached feed so it shows at top. */
export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePostInput) => getProvider().createPost(input),
    onSuccess: (post) => {
      qc.setQueryData(["feed"], (data: any) => {
        if (!data?.pages?.length) return data;
        const [first, ...rest] = data.pages;
        return { ...data, pages: [{ ...first, items: [post, ...first.items] }, ...rest] };
      });
    },
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

export function useActivity() {
  return useInfiniteQuery({
    queryKey: ["activity"],
    queryFn: ({ pageParam }) => getProvider().getActivity(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: Page<Notification>) => last.nextCursor,
  });
}

export function useComments(postId: ID) {
  return useInfiniteQuery({
    queryKey: ["comments", postId],
    queryFn: ({ pageParam }) => getProvider().getComments(postId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: Page<Comment>) => last.nextCursor,
  });
}

/** Post a comment; optimistically prepends it to the cached first page. */
export function useAddComment(postId: ID) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => getProvider().addComment(postId, text),
    onSuccess: (comment) => {
      qc.setQueryData(["comments", postId], (data: any) => {
        if (!data?.pages?.length) return data;
        const [first, ...rest] = data.pages;
        return { ...data, pages: [{ ...first, items: [comment, ...first.items] }, ...rest] };
      });
    },
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

export function useMessages(conversationId: ID) {
  return useInfiniteQuery({
    queryKey: ["messages", conversationId],
    queryFn: ({ pageParam }) => getProvider().getMessages(conversationId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: Page<DirectMessage>) => last.nextCursor,
  });
}

/** Send a DM; optimistically prepends it (newest-first, for an inverted list). */
export function useSendMessage(conversationId: ID) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => getProvider().sendMessage(conversationId, text),
    onSuccess: (msg) => {
      qc.setQueryData(["messages", conversationId], (data: any) => {
        if (!data?.pages?.length) return data;
        const [first, ...rest] = data.pages;
        return { ...data, pages: [{ ...first, items: [msg, ...first.items] }, ...rest] };
      });
    },
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

/** Optimistic save/bookmark toggle — mirrors useToggleLike. */
export function useToggleSave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, save }: { postId: ID; save: boolean }) =>
      getProvider().setSave(postId, save),
    onMutate: async ({ postId, save }) => {
      await qc.cancelQueries({ queryKey: ["feed"] });
      const prev = qc.getQueryData(["feed"]);
      qc.setQueryData(["feed"], (data: any) => {
        if (!data) return data;
        return {
          ...data,
          pages: data.pages.map((page: Page<Post>) => ({
            ...page,
            items: page.items.map((p) => (p.id === postId ? { ...p, savedByMe: save } : p)),
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
