/**
 * Thin HTTP client for the IG private API.
 *
 * Responsibilities: attach app-like headers, pace requests to look human
 * (docs/SPRINT.md §1 ban-risk mitigation), and translate failures into typed
 * SocialProviderError codes so the UI can degrade gracefully.
 */

import { SocialProviderError } from "../SocialProvider";
import { appHeaders } from "./endpoints";
import { getDevice } from "./device";
import type { IGSession } from "./session";

/** Minimum gap between requests, to avoid burst patterns that get flagged. */
const MIN_REQUEST_GAP_MS = 350;

export class IGClient {
  private lastRequestAt = 0;

  constructor(private getSession: () => IGSession | null) {}

  private requireSession(): IGSession {
    const session = this.getSession();
    if (!session) throw new SocialProviderError("Not authenticated", "auth_failed");
    return session;
  }

  private async pace(): Promise<void> {
    // Date.now(), not performance.now(): the latter isn't guaranteed on all
    // React Native/Hermes runtimes and would throw at first request.
    const now = Date.now();
    const wait = MIN_REQUEST_GAP_MS - (now - this.lastRequestAt);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    this.lastRequestAt = Date.now();
  }

  async get<T>(url: string): Promise<T> {
    this.requireSession();
    return this.request<T>(url, { method: "GET" });
  }

  async post<T>(url: string, body?: Record<string, string>): Promise<T> {
    const session = this.requireSession();
    const device = await getDevice();
    // IG validates the csrftoken on writes; _uid/_uuid/device_id identify the
    // actor + install. Caller fields win if they set these explicitly.
    const signed: Record<string, string> = {
      ...(session.csrftoken ? { _csrftoken: session.csrftoken } : {}),
      ...(session.userId ? { _uid: session.userId } : {}),
      _uuid: device.uuid,
      device_id: device.deviceId,
      ...(body ?? {}),
    };
    return this.request<T>(url, {
      method: "POST",
      body: new URLSearchParams(signed).toString(),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  }

  private async request<T>(url: string, init: RequestInit): Promise<T> {
    const session = this.requireSession();
    await this.pace();
    let res: Response;
    try {
      res = await fetch(url, {
        ...init,
        headers: { ...appHeaders(session), ...(init.headers ?? {}) },
      });
    } catch (cause) {
      throw new SocialProviderError("Network request failed", "network", cause);
    }

    // Read the body once as text so we can both classify errors and parse JSON.
    const body = await res.text().catch(() => "");
    if (__DEV__) console.log(`[IG] ${res.status} ${url} — ${body.slice(0, 200)}`);

    if (res.ok) {
      try {
        return JSON.parse(body) as T;
      } catch (cause) {
        throw new SocialProviderError("Unexpected response shape", "upstream_changed", cause);
      }
    }

    const lower = body.toLowerCase();

    if (res.status === 429 || lower.includes("please wait") || lower.includes("feedback_required")) {
      throw new SocialProviderError("Instagram is rate-limiting requests", "rate_limited");
    }
    // A real security wall on the account (distinct from a stale session).
    if (lower.includes("checkpoint") || lower.includes("challenge")) {
      throw new SocialProviderError("Instagram needs you to verify this account", "account_flagged");
    }
    // login_required / session_expired: the session isn't valid here — not a ban.
    if (res.status === 401 || res.status === 403 || lower.includes("login_required")) {
      throw new SocialProviderError("Your Instagram session isn't valid — log in again", "auth_failed");
    }
    throw new SocialProviderError(`Instagram returned ${res.status}`, "upstream_changed");
  }
}
