/**
 * Provider registry — the single place to choose Wax's active backend.
 *
 * The rest of the app imports `getProvider()` and never references a concrete
 * implementation. To swap backends (mock ↔ IG private API ↔ future Wax-native),
 * change ONLY the WAX_BACKEND switch. This is how the SocialProvider abstraction
 * (docs/SPRINT.md §5) pays off operationally.
 *
 * Default is "mock" so the app runs with zero account risk out of the box. Set
 * EXPO_PUBLIC_WAX_BACKEND=ig to exercise the real IGPrivateProvider on a device
 * with a (burner) account.
 */

import type { SocialProvider } from "./SocialProvider";
import { MockProvider } from "./MockProvider";
import { IGPrivateProvider } from "./IGPrivateProvider";

type Backend = "mock" | "ig";

const WAX_BACKEND: Backend =
  (process.env.EXPO_PUBLIC_WAX_BACKEND as Backend) ?? "mock";

let active: SocialProvider | null = null;

export function getProvider(): SocialProvider {
  if (!active) {
    active = WAX_BACKEND === "ig" ? new IGPrivateProvider() : new MockProvider();
  }
  return active;
}

/** Which backend is live — handy for diagnostics and the login screen. */
export function activeBackend(): Backend {
  return WAX_BACKEND;
}

export type { SocialProvider } from "./SocialProvider";
export { SocialProviderError } from "./SocialProvider";
