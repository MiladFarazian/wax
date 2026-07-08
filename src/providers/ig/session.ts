/**
 * IG session — the set of cookies Wax needs to act as the logged-in user.
 *
 * Instagram authenticates the app with a handful of cookies, not one. We need:
 *   - sessionid   the actual auth token (HttpOnly on IG's side)
 *   - csrftoken   required on every write (like/follow/comment); IG rejects
 *                 writes without a matching X-CSRFToken header + _csrftoken body
 *   - ds_user_id  the logged-in user's id — free, no round-trip needed
 *
 * The SocialProvider contract passes a single opaque `token: string` around
 * (stored on-device via secureSession). For IG that opaque string is a JSON
 * encoding of this struct, so the rest of the app never learns IG's cookie
 * shape. `decodeIGToken` also accepts a bare sessionid string for backward
 * compatibility with any token captured before this struct existed.
 */

export interface IGSession {
  sessionid: string;
  csrftoken?: string;
  userId?: string;
  /** Resolved after login; the web profile endpoint is keyed by username. */
  username?: string;
}

export function encodeIGToken(session: IGSession): string {
  return JSON.stringify(session);
}

export function decodeIGToken(token: string): IGSession | null {
  if (!token) return null;
  try {
    const parsed = JSON.parse(token);
    if (parsed && typeof parsed.sessionid === "string" && parsed.sessionid) {
      return {
        sessionid: parsed.sessionid,
        csrftoken: typeof parsed.csrftoken === "string" ? parsed.csrftoken : undefined,
        userId: typeof parsed.userId === "string" ? parsed.userId : undefined,
      };
    }
    return null;
  } catch {
    // Legacy: a plain sessionid string (pre-struct capture).
    return { sessionid: token };
  }
}
