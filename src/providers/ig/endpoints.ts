/**
 * Instagram private (app) API surface used by IGPrivateProvider.
 *
 * ⚠️ These endpoints are NOT official, NOT documented, and NOT stable. Meta
 * changes them to break third-party clients (see docs/SPRINT.md §1). They are
 * captured here in ONE place so that when (not if) they shift, there's a single
 * file to update — and so the rest of the codebase never hardcodes IG details.
 *
 * The request SHAPES below reflect how the official Instagram app talks to its
 * `i.instagram.com` host. They have NOT been verified against live endpoints
 * from this environment — they MUST be validated on a real device with a real
 * (ideally burner) account before relying on them (OPEN-QUESTIONS #5).
 */

import type { IGSession } from "./session";

export const IG_API_BASE = "https://i.instagram.com/api/v1";
export const IG_WEB_BASE = "https://www.instagram.com";

/** Login page Wax loads in a webview so the user authenticates on IG directly. */
export const IG_LOGIN_URL = `${IG_WEB_BASE}/accounts/login/`;

/**
 * Headers that make a request look like the official app rather than a scraper.
 * The User-Agent string encodes app version + device; a realistic, stable value
 * lowers flag risk. Placeholder values here — finalize against a current app
 * build before production.
 *
 * The Cookie header carries the full session (sessionid + csrftoken + ds_user_id)
 * because IG's write endpoints validate the csrftoken cookie against the
 * X-CSRFToken header. Reads work with sessionid alone; writes need all three.
 */
export function appHeaders(session: IGSession): Record<string, string> {
  const cookie = [
    `sessionid=${session.sessionid}`,
    session.csrftoken ? `csrftoken=${session.csrftoken}` : "",
    session.userId ? `ds_user_id=${session.userId}` : "",
  ]
    .filter(Boolean)
    .join("; ");

  const headers: Record<string, string> = {
    "User-Agent":
      "Instagram 309.0.0.40.113 Android (33/13; 420dpi; 1080x2210; Wax; device; en_US)",
    "X-IG-App-ID": "936619743392459", // public web app id used by IG web
    "X-IG-Capabilities": "3brTvw==",
    "Accept-Language": "en-US",
    Cookie: cookie,
  };
  if (session.csrftoken) headers["X-CSRFToken"] = session.csrftoken;
  return headers;
}

export const endpoints = {
  timelineFeed: `${IG_API_BASE}/feed/timeline/`,
  currentUser: `${IG_API_BASE}/accounts/current_user/?edit=true`,
  reelsTray: `${IG_API_BASE}/feed/reels_tray/`, // stories tray (name is IG's, not Reels)
  userInfo: (userId: string) => `${IG_API_BASE}/users/${userId}/info/`,
  userFeed: (userId: string) => `${IG_API_BASE}/feed/user/${userId}/`,
  like: (mediaId: string) => `${IG_API_BASE}/media/${mediaId}/like/`,
  unlike: (mediaId: string) => `${IG_API_BASE}/media/${mediaId}/unlike/`,
  save: (mediaId: string) => `${IG_API_BASE}/media/${mediaId}/save/`,
  unsave: (mediaId: string) => `${IG_API_BASE}/media/${mediaId}/unsave/`,
  comments: (mediaId: string) => `${IG_API_BASE}/media/${mediaId}/comments/`,
  addComment: (mediaId: string) => `${IG_API_BASE}/media/${mediaId}/comment/`,
  follow: (userId: string) => `${IG_API_BASE}/friendships/create/${userId}/`,
  unfollow: (userId: string) => `${IG_API_BASE}/friendships/destroy/${userId}/`,
  newsInbox: `${IG_API_BASE}/news/inbox/`, // activity feed (likes/follows/comments)
  inbox: `${IG_API_BASE}/direct_v2/inbox/`,
  thread: (threadId: string) => `${IG_API_BASE}/direct_v2/threads/${threadId}/`,
} as const;
