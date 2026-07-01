/**
 * Wax domain types.
 *
 * These are Wax's OWN models — deliberately decoupled from any specific backend
 * (Instagram private API, Graph API, or a future Wax-native network). Each
 * provider is responsible for mapping its raw payloads into these shapes so the
 * UI never depends on a particular data source.
 *
 * Note what's intentionally ABSENT: there is no `Reel` type and no reels-related
 * media kind. Wax does not model Reels. This is by design (see docs/SPRINT.md).
 */

export type ID = string;

export interface User {
  id: ID;
  username: string;
  fullName?: string;
  avatarUrl?: string;
  isVerified?: boolean;
  isPrivate?: boolean;
}

export interface UserProfile extends User {
  bio?: string;
  website?: string;
  postCount: number;
  followerCount: number;
  followingCount: number;
  isFollowedByMe?: boolean;
}

/** Only photo/video posts and carousels. No "reel" kind — that's the whole point. */
export type MediaKind = "image" | "video" | "carousel";

export interface MediaItem {
  /** Always a still image URL (the photo, or a video's cover) so any surface can
   *  render instantly. For video, `videoUrl` carries the playable source. */
  url: string;
  kind: "image" | "video";
  /** Playable source, present only when kind === "video". */
  videoUrl?: string;
  width?: number;
  height?: number;
  /** Tiny blur placeholder for instant, calm image loads. */
  blurhash?: string;
}

export interface Post {
  id: ID;
  author: User;
  kind: MediaKind;
  media: MediaItem[];
  caption?: string;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  createdAt: string; // ISO 8601
  /** Provider-flagged sponsored content; UI may label it. */
  isSponsored?: boolean;
}

export interface Comment {
  id: ID;
  author: User;
  text: string;
  likeCount: number;
  likedByMe: boolean;
  createdAt: string;
}

export interface StoryItem {
  id: ID;
  media: MediaItem;
  createdAt: string;
  expiresAt: string;
}

export interface StoryTray {
  user: User;
  items: StoryItem[];
  seen: boolean;
}

export interface Conversation {
  id: ID;
  participants: User[];
  lastMessagePreview?: string;
  unread: boolean;
  updatedAt: string;
}

export interface DirectMessage {
  id: ID;
  conversationId: ID;
  sender: User;
  text?: string;
  media?: MediaItem;
  createdAt: string;
}

/** Cursor-based pagination so feeds page lazily and cache cleanly. */
export interface Page<T> {
  items: T[];
  nextCursor?: string;
}

export interface AuthSession {
  userId: ID;
  /** Opaque session token. Stored on-device only (Keychain/Keystore). */
  token: string;
  createdAt: string;
}

export interface Credentials {
  username: string;
  password: string;
}
