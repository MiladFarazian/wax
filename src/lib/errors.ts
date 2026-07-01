/**
 * Error presentation — turns a thrown error into calm, user-facing copy.
 *
 * The whole point of SocialProviderError (see providers/SocialProvider.ts) is
 * that the UI can degrade gracefully instead of crashing or showing a blank
 * screen. This is where each failure code becomes a reassuring message and a
 * decision about whether retrying even makes sense. Trust is the product
 * (docs/SPRINT.md §2.5) — the failure states have to feel calm too.
 */

import { SocialProviderError } from "@/providers/SocialProvider";

export interface ErrorInfo {
  title: string;
  message: string;
  /** False when retrying can't help (expired/flagged session) — hide "Try again". */
  canRetry: boolean;
}

export function describeError(error: unknown): ErrorInfo {
  if (error instanceof SocialProviderError) {
    switch (error.code) {
      case "account_flagged":
        return {
          title: "Instagram paused this session",
          message:
            "Instagram flagged or checkpointed your account. Open the Instagram app to clear it, then reconnect Wax.",
          canRetry: false,
        };
      case "auth_failed":
        return {
          title: "You're signed out",
          message: "Your Instagram session expired. Reconnect to keep browsing.",
          canRetry: false,
        };
      case "rate_limited":
        return {
          title: "Too fast for Instagram",
          message: "Instagram is rate-limiting requests. Give it a moment, then try again.",
          canRetry: true,
        };
      case "network":
        return {
          title: "You're offline",
          message: "Wax couldn't reach Instagram. Check your connection and try again.",
          canRetry: true,
        };
      case "upstream_changed":
        return {
          title: "Something changed at Instagram",
          message:
            "Wax got an unexpected response from Instagram — this can happen when Instagram updates. Try again shortly.",
          canRetry: true,
        };
    }
  }
  return {
    title: "Something went wrong",
    message: "An unexpected error occurred. Please try again.",
    canRetry: true,
  };
}
