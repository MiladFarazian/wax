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

export const IG_WEB_BASE = "https://www.instagram.com";
// We capture a WEB session (login on www.instagram.com), so we talk to the web
// API host, not the mobile app host (i.instagram.com). A web session gets
// login_required on the mobile app endpoints; the web host honors it.
export const IG_API_BASE = `${IG_WEB_BASE}/api/v1`;

/** Login page Wax loads in a webview so the user authenticates on IG directly. */
export const IG_LOGIN_URL = `${IG_WEB_BASE}/accounts/login/`;

/**
 * Headers matching the WEB client, so they're consistent with the web session
 * we captured. The web API authenticates via the sessionid cookie + the web
 * X-IG-App-ID + a matching browser User-Agent; X-CSRFToken is required on writes.
 * (The mobile-app UA + X-IG-Capabilities would contradict a web session and
 * trigger login_required.)
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
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    "X-IG-App-ID": "936619743392459", // Instagram web app id
    "X-Requested-With": "XMLHttpRequest",
    "X-ASBD-ID": "129477",
    Referer: `${IG_WEB_BASE}/`,
    Origin: IG_WEB_BASE,
    Accept: "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    Cookie: cookie,
  };
  if (session.csrftoken) headers["X-CSRFToken"] = session.csrftoken;
  return headers;
}

export const endpoints = {
  timelineFeed: `${IG_API_BASE}/feed/timeline/`,
  currentUser: `${IG_API_BASE}/accounts/current_user/?edit=true`,
  // The web profile endpoint returns counts, HD avatar, and the first ~12 posts.
  webProfileInfo: (username: string) =>
    `${IG_API_BASE}/users/web_profile_info/?username=${encodeURIComponent(username)}`,
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
