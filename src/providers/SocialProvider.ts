/**
 * SocialProvider — THE key abstraction (see docs/SPRINT.md §5).
 *
 * Every data source must implement this single interface. The UI talks ONLY to
 * a `SocialProvider`; it never knows or cares which backend is behind it.
 *
 * Why this matters: Wax's launch backend (unofficial Instagram private API)
 * carries existential risk — Meta can break it or send a cease-and-desist at
 * any time. Because the UI depends only on this interface, we can swap in a
 * different implementation (official Graph API, or a Wax-native network)
 * WITHOUT rewriting the app. This interface is Wax's insurance policy.
 *
 * Deliberate omission: there is no `getReels()` / `getReelsFeed()` method.
 * Wax does not surface Reels. The contract itself enforces the product thesis.
 */

import type {
  AuthSession,
  Comment,
  Conversation,
  Credentials,
  DirectMessage,
  ID,
  Notification,
  Page,
  Post,
  StoryTray,
  UserProfile,
} from "@/types/social";

export interface SocialProvider {
  /** Stable identifier for diagnostics/telemetry, e.g. "ig-private". */
  readonly name: string;

  // --- Auth ---
  login(credentials: Credentials): Promise<AuthSession>;
  logout(): Promise<void>;
  /** Resume from a securely stored session token; null if none/expired. */
  restoreSession(token: string): Promise<AuthSession | null>;
  getCurrentUserId(): ID | null;

  // --- Feed (photos / videos / carousels only — never Reels) ---
  getFeed(cursor?: string): Promise<Page<Post>>;

  // --- Stories ---
  getStoryTrays(): Promise<StoryTray[]>;

  // --- Profiles ---
  getProfile(userId: ID): Promise<UserProfile>;
  getUserPosts(userId: ID, cursor?: string): Promise<Page<Post>>;
  setFollow(userId: ID, follow: boolean): Promise<void>;

  // --- Post interactions ---
  setLike(postId: ID, like: boolean): Promise<void>;
  setSave(postId: ID, save: boolean): Promise<void>;
  getComments(postId: ID, cursor?: string): Promise<Page<Comment>>;
  addComment(postId: ID, text: string): Promise<Comment>;

  // --- Activity ---
  getActivity(cursor?: string): Promise<Page<Notification>>;

  // --- Direct messages ---
  getConversations(cursor?: string): Promise<Page<Conversation>>;
  getMessages(conversationId: ID, cursor?: string): Promise<Page<DirectMessage>>;
  sendMessage(conversationId: ID, text: string): Promise<DirectMessage>;
}

/**
 * Thrown when a provider hits an upstream failure (e.g. the unofficial API
 * changed or the account was flagged). The UI uses this to degrade gracefully
 * instead of crashing — central to the Phase 4 resilience drill.
 */
export class SocialProviderError extends Error {
  constructor(
    message: string,
    readonly code:
      | "auth_failed"
      | "rate_limited"
      | "account_flagged"
      | "upstream_changed"
      | "network"
      | "unknown" = "unknown",
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "SocialProviderError";
  }
}
