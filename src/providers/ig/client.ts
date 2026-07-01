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

    if (res.status === 429) {
      throw new SocialProviderError("Rate limited by Instagram", "rate_limited");
    }
    if (res.status === 401 || res.status === 403) {
      // A previously-valid session being rejected usually means a checkpoint /
      // flag on the account — surface it distinctly so the UI can warn the user.
      throw new SocialProviderError("Session rejected (possible checkpoint)", "account_flagged");
    }
    if (!res.ok) {
      throw new SocialProviderError(`Instagram returned ${res.status}`, "upstream_changed");
    }

    try {
      return (await res.json()) as T;
    } catch (cause) {
      // A non-JSON body where JSON was expected usually means IG changed the API.
      throw new SocialProviderError("Unexpected response shape", "upstream_changed", cause);
    }
  }
}
