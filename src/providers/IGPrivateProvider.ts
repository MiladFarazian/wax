/**
 * IGPrivateProvider — the real Instagram backend (unofficial private API).
 *
 * Implements the SocialProvider contract against Instagram's app endpoints
 * using a session token captured via the webview login flow (auth decision:
 * session-token import — see docs/OPEN-QUESTIONS.md). The token lives on-device
 * only; this class receives it via getCurrentToken() and never persists it.
 *
 * ⚠️ NOT LIVE-TESTED from this environment. Endpoint shapes (./ig/endpoints.ts)
 * and mappers (./ig/mappers.ts) reflect how the official app behaves but MUST be
 * validated on a real device with a burner account before production
 * (OPEN-QUESTIONS #5). Every Reel is dropped at the mapper boundary.
 */

import type { SocialProvider } from "./SocialProvider";
import type {
  AuthSession,
  Comment,
  Conversation,
  CreatePostInput,
  Credentials,
  DirectMessage,
  ID,
  Notification,
  Page,
  Post,
  StoryTray,
  User,
  UserProfile,
} from "@/types/social";
import { SocialProviderError } from "./SocialProvider";
import { IGClient } from "./ig/client";
import { endpoints, IG_GRAPHQL_URL } from "./ig/endpoints";
import { decodeIGToken, type IGSession } from "./ig/session";
import {
  mapActivity,
  mapComment,
  mapConversation,
  mapFeedItems,
  mapProfile,
  mapStoryTray,
  mapUser,
  mapWebProfile,
  mapWebProfilePosts,
} from "./ig/mappers";

/* eslint-disable @typescript-eslint/no-explicit-any */

export class IGPrivateProvider implements SocialProvider {
  readonly name = "ig-private";

  private session: IGSession | null = null;
  private readonly client = new IGClient(() => this.session);

  // --- Auth ------------------------------------------------------------------

  /**
   * Direct username/password login is intentionally NOT supported — it triggers
   * checkpoints and carries the highest ban risk. Wax authenticates by importing
   * a session token from the webview login flow; use restoreSession() with it.
   */
  async login(_credentials: Credentials): Promise<AuthSession> {
    throw new SocialProviderError(
      "Password login is disabled. Wax uses session-token import via the IG login webview.",
      "auth_failed",
    );
  }

  /**
   * Adopt a session captured by the login webview. `token` is the opaque string
   * produced by encodeIGToken (sessionid + csrftoken + ds_user_id). We confirm
   * it works by reading the current user, and treat that response as the
   * source of truth for the viewer id.
   */
  async restoreSession(token: string): Promise<AuthSession | null> {
    const session = decodeIGToken(token);
    if (!session?.sessionid) return null;
    this.session = session;
    // Resolve the real id + username from users/{id}/info/ (a GET the web
    // session honors). Fall back to the ds_user_id cookie so a partly-valid
    // session still lets us in — per-call failures then surface in the UI.
    let userId = session.userId ?? "";
    let username = session.username;
    if (userId) {
      try {
        const me = await this.client.get<any>(endpoints.userInfo(userId));
        userId = String(me?.user?.pk ?? me?.user?.pk_id ?? userId);
        username = me?.user?.username ?? username;
      } catch {
        // keep the cookie-derived id
      }
    }
    if (!userId) {
      this.session = null;
      return null;
    }
    this.session = { ...session, userId, username };
    return { userId, token, createdAt: new Date().toISOString() };
  }

  async logout(): Promise<void> {
    this.session = null;
  }

  getCurrentUserId(): ID | null {
    return this.session?.userId ?? null;
  }

  // --- Feed (Reels stripped in mapFeedItems) ---------------------------------

  /**
   * Posting isn't implemented yet. Real IG photo upload is a multi-step signed
   * flow (rupload_igphoto → configure) that must be built and validated on a
   * device before enabling (Phase 2). Fail loudly rather than pretend.
   */
  async createPost(_input: CreatePostInput): Promise<Post> {
    throw new SocialProviderError("Posting isn't supported yet on Instagram.", "upstream_changed");
  }

  async getFeed(cursor?: string): Promise<Page<Post>> {
    // Web home feed is served by GraphQL (doc_id-based; ids rotate over time).
    const data = await this.client.post<any>(IG_GRAPHQL_URL, {
      doc_id: "8845758582119845",
      variables: JSON.stringify(cursor ? { after: cursor, first: 12 } : { first: 12 }),
    });
    const conn = data?.data?.xdt_api__v1__feed__timeline__connection;
    const nodes = (conn?.edges ?? []).map((e: any) => e?.node ?? e);
    return {
      items: mapFeedItems(nodes),
      nextCursor: conn?.page_info?.has_next_page ? conn?.page_info?.end_cursor : undefined,
    };
  }

  // --- Stories ---------------------------------------------------------------

  async getStoryTrays(): Promise<StoryTray[]> {
    // Stories tray is also a POST on the web.
    const data = await this.client.post<any>(endpoints.reelsTray, { reason: "cold_start" });
    return (data?.tray ?? []).map(mapStoryTray);
  }

  // --- Profiles --------------------------------------------------------------

  /** The username to query the web profile endpoint with, if we can resolve one. */
  private usernameFor(userId: ID): string | undefined {
    if (userId === "u_me" || userId === this.session?.userId) return this.session?.username;
    // A non-numeric "id" is actually a username (from the search flow / user route).
    if (userId && !/^\d+$/.test(userId)) return userId;
    return undefined;
  }

  async searchUsers(query: string): Promise<User[]> {
    const q = query.trim();
    if (!q) return [];
    const data = await this.client.get<any>(endpoints.topSearch(q));
    return (data?.users ?? []).map((entry: any) => mapUser(entry?.user)).filter((u: User) => u.username);
  }

  async getProfile(userId: ID): Promise<UserProfile> {
    // web_profile_info gives counts + HD avatar + posts in one call.
    const username = this.usernameFor(userId);
    if (username) {
      const data = await this.client.get<any>(endpoints.webProfileInfo(username));
      const user = data?.data?.user;
      if (user) return mapWebProfile(user);
    }
    // Fallback: users/{id}/info/ (trimmed — name/avatar but no counts).
    const id = userId === "u_me" ? (this.session?.userId ?? userId) : userId;
    const data = await this.client.get<any>(endpoints.userInfo(id));
    return mapProfile(data?.user ?? {});
  }

  async getUserPosts(userId: ID, cursor?: string): Promise<Page<Post>> {
    // First page of the current user's grid comes from web_profile_info.
    const username = this.usernameFor(userId);
    if (username && !cursor) {
      const data = await this.client.get<any>(endpoints.webProfileInfo(username));
      const user = data?.data?.user;
      if (user) return { items: mapWebProfilePosts(user), nextCursor: undefined };
    }
    const url = cursor
      ? `${endpoints.userFeed(userId)}?max_id=${encodeURIComponent(cursor)}`
      : endpoints.userFeed(userId);
    const data = await this.client.get<any>(url);
    return {
      items: mapFeedItems(data?.items ?? []),
      nextCursor: data?.next_max_id || undefined,
    };
  }

  async setFollow(userId: ID, follow: boolean): Promise<void> {
    await this.client.post(follow ? endpoints.follow(userId) : endpoints.unfollow(userId));
  }

  // --- Post interactions -----------------------------------------------------

  async setLike(postId: ID, like: boolean): Promise<void> {
    await this.client.post(like ? endpoints.like(postId) : endpoints.unlike(postId), {
      media_id: postId,
    });
  }

  async setSave(postId: ID, save: boolean): Promise<void> {
    await this.client.post(save ? endpoints.save(postId) : endpoints.unsave(postId));
  }

  async getComments(postId: ID, cursor?: string): Promise<Page<Comment>> {
    const url = cursor
      ? `${endpoints.comments(postId)}?min_id=${encodeURIComponent(cursor)}`
      : endpoints.comments(postId);
    const data = await this.client.get<any>(url);
    return {
      items: (data?.comments ?? []).map(mapComment),
      nextCursor: data?.next_min_id || undefined,
    };
  }

  async addComment(postId: ID, text: string): Promise<Comment> {
    const data = await this.client.post<any>(endpoints.addComment(postId), {
      comment_text: text,
    });
    return mapComment(data?.comment ?? { text, user: { pk: this.session?.userId } });
  }

  // --- Activity --------------------------------------------------------------

  async getActivity(_cursor?: string): Promise<Page<Notification>> {
    const data = await this.client.get<any>(endpoints.newsInbox);
    return { items: mapActivity(data), nextCursor: undefined };
  }

  // --- Direct messages -------------------------------------------------------

  async getConversations(cursor?: string): Promise<Page<Conversation>> {
    const url = cursor
      ? `${endpoints.inbox}?cursor=${encodeURIComponent(cursor)}`
      : endpoints.inbox;
    const data = await this.client.get<any>(url);
    return {
      items: (data?.inbox?.threads ?? []).map(mapConversation),
      nextCursor: data?.inbox?.oldest_cursor || undefined,
    };
  }

  async getMessages(conversationId: ID, cursor?: string): Promise<Page<DirectMessage>> {
    const url = cursor
      ? `${endpoints.thread(conversationId)}?cursor=${encodeURIComponent(cursor)}`
      : endpoints.thread(conversationId);
    const data = await this.client.get<any>(url);
    const items: DirectMessage[] = (data?.thread?.items ?? []).map((it: any) => ({
      id: String(it?.item_id ?? ""),
      conversationId,
      sender: { id: String(it?.user_id ?? ""), username: "" },
      text: it?.text || undefined,
      createdAt: new Date((it?.timestamp ?? 0) / 1000).toISOString(),
    }));
    return { items, nextCursor: data?.thread?.oldest_cursor || undefined };
  }

  async sendMessage(conversationId: ID, text: string): Promise<DirectMessage> {
    await this.client.post(`${endpoints.thread(conversationId)}broadcast/text/`, {
      text,
      thread_id: conversationId,
    });
    return {
      id: "pending",
      conversationId,
      sender: { id: this.session?.userId ?? "", username: "" },
      text,
      createdAt: new Date().toISOString(),
    };
  }
}
