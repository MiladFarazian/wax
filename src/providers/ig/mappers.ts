/**
 * Mappers: raw Instagram payloads → Wax domain types.
 *
 * Wax's UI never sees an IG shape — only the clean models in src/types/social.ts.
 * This boundary is what lets us swap backends later. The Reels filter is applied
 * here so no Reel ever escapes into a Wax model.
 *
 * The raw shapes are typed loosely (`any`-ish) on purpose: IG payloads are
 * undocumented and vary by version. We read defensively and validate live.
 */

import type {
  Comment,
  Conversation,
  MediaItem,
  Post,
  StoryTray,
  User,
  UserProfile,
} from "@/types/social";
import { isReel } from "./reelsFilter";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function mapUser(raw: any): User {
  return {
    id: String(raw?.pk ?? raw?.id ?? ""),
    username: raw?.username ?? "",
    fullName: raw?.full_name || undefined,
    avatarUrl: raw?.profile_pic_url || undefined,
    isVerified: !!raw?.is_verified,
    isPrivate: !!raw?.is_private,
  };
}

/** IG media_type: 1 = photo, 2 = video, 8 = carousel. */
const IG_MEDIA_VIDEO = 2;

/**
 * One IG media node → one Wax MediaItem. `url` is always a still (photo, or a
 * video's cover frame) so every surface renders instantly; for video we also
 * carry the playable `videoUrl`. Stories & normal feed video are kept — only
 * Reels are dropped, upstream in mapPost/mapStoryTray.
 */
function mapMedia(raw: any): MediaItem | undefined {
  const cover = raw?.image_versions2?.candidates?.[0];
  if (!cover?.url) return undefined;
  const base: MediaItem = {
    url: cover.url,
    kind: "image",
    width: cover.width,
    height: cover.height,
  };
  if (raw?.media_type === IG_MEDIA_VIDEO) {
    const videoUrl = raw?.video_versions?.[0]?.url;
    if (videoUrl) return { ...base, kind: "video", videoUrl };
  }
  return base;
}

/** Map a single IG media item to a Wax Post. Returns null for Reels. */
export function mapPost(raw: any): Post | null {
  if (isReel(raw)) return null;

  const isCarousel = Array.isArray(raw?.carousel_media) && raw.carousel_media.length > 1;
  const media: MediaItem[] = isCarousel
    ? raw.carousel_media.map((m: any) => mapMedia(m)).filter(Boolean)
    : ([mapMedia(raw)].filter(Boolean) as MediaItem[]);

  if (media.length === 0) return null;

  const kind = isCarousel ? "carousel" : media[0].kind;

  return {
    id: String(raw?.pk ?? raw?.id ?? ""),
    author: mapUser(raw?.user),
    kind,
    media,
    caption: raw?.caption?.text || undefined,
    likeCount: raw?.like_count ?? 0,
    commentCount: raw?.comment_count ?? 0,
    likedByMe: !!raw?.has_liked,
    savedByMe: !!raw?.has_viewer_saved,
    createdAt: new Date((raw?.taken_at ?? 0) * 1000).toISOString(),
    isSponsored: !!raw?.is_paid_partnership || raw?.injected != null,
  };
}

/** Map a timeline-feed response to Posts, dropping Reels and ads-as-reels. */
export function mapFeedItems(items: any[]): Post[] {
  return items
    .map((entry) => entry?.media_or_ad ?? entry?.media ?? entry)
    .map(mapPost)
    .filter((p): p is Post => p != null);
}

export function mapProfile(raw: any): UserProfile {
  return {
    ...mapUser(raw),
    bio: raw?.biography || undefined,
    website: raw?.external_url || undefined,
    postCount: raw?.media_count ?? 0,
    followerCount: raw?.follower_count ?? 0,
    followingCount: raw?.following_count ?? 0,
    isFollowedByMe: raw?.friendship_status?.following ?? undefined,
  };
}

export function mapStoryTray(raw: any): StoryTray {
  return {
    user: mapUser(raw?.user),
    seen: (raw?.seen ?? 0) >= (raw?.latest_reel_media ?? 0),
    items: (raw?.items ?? [])
      .filter((it: any) => !isReel(it))
      .map((it: any) => {
        const img = mapMedia(it);
        return {
          id: String(it?.pk ?? ""),
          media: img ?? { url: "", kind: "image" },
          createdAt: new Date((it?.taken_at ?? 0) * 1000).toISOString(),
          expiresAt: new Date((it?.expiring_at ?? 0) * 1000).toISOString(),
        };
      }),
  };
}

export function mapComment(raw: any): Comment {
  return {
    id: String(raw?.pk ?? ""),
    author: mapUser(raw?.user),
    text: raw?.text ?? "",
    likeCount: raw?.comment_like_count ?? 0,
    likedByMe: !!raw?.has_liked_comment,
    createdAt: new Date((raw?.created_at ?? 0) * 1000).toISOString(),
  };
}

export function mapConversation(raw: any): Conversation {
  return {
    id: String(raw?.thread_id ?? ""),
    participants: (raw?.users ?? []).map(mapUser),
    lastMessagePreview: raw?.last_permanent_item?.text || undefined,
    unread: (raw?.read_state ?? 0) === 1,
    updatedAt: new Date((raw?.last_activity_at ?? 0) / 1000).toISOString(),
  };
}
