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
  Credentials,
  DirectMessage,
  ID,
  Page,
  Post,
  StoryTray,
  UserProfile,
} from "@/types/social";
import { SocialProviderError } from "./SocialProvider";
import { IGClient } from "./ig/client";
import { endpoints } from "./ig/endpoints";
import { decodeIGToken, type IGSession } from "./ig/session";
import {
  mapComment,
  mapConversation,
  mapFeedItems,
  mapProfile,
  mapStoryTray,
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
    if (!session) return null;
    this.session = session;
    try {
      const me = await this.client.get<any>(endpoints.currentUser);
      const userId = String(me?.user?.pk ?? me?.user?.pk_id ?? session.userId ?? "");
      if (!userId) {
        this.session = null;
        return null;
      }
      this.session = { ...session, userId };
      return { userId, token, createdAt: new Date().toISOString() };
    } catch {
      this.session = null;
      return null;
    }
  }

  async logout(): Promise<void> {
    this.session = null;
  }

  getCurrentUserId(): ID | null {
    return this.session?.userId ?? null;
  }

  // --- Feed (Reels stripped in mapFeedItems) ---------------------------------

  async getFeed(cursor?: string): Promise<Page<Post>> {
    const url = cursor
      ? `${endpoints.timelineFeed}?max_id=${encodeURIComponent(cursor)}`
      : endpoints.timelineFeed;
    const data = await this.client.get<any>(url);
    return {
      items: mapFeedItems(data?.feed_items ?? data?.items ?? []),
      nextCursor: data?.next_max_id || undefined,
    };
  }

  // --- Stories ---------------------------------------------------------------

  async getStoryTrays(): Promise<StoryTray[]> {
    const data = await this.client.get<any>(endpoints.reelsTray);
    return (data?.tray ?? []).map(mapStoryTray);
  }

  // --- Profiles --------------------------------------------------------------

  async getProfile(userId: ID): Promise<UserProfile> {
    const data = await this.client.get<any>(endpoints.userInfo(userId));
    return mapProfile(data?.user ?? {});
  }

  async getUserPosts(userId: ID, cursor?: string): Promise<Page<Post>> {
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
