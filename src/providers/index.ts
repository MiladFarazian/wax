/**
 * Provider registry — the single place to choose Wax's active backend.
 *
 * The rest of the app imports `getProvider()` and never references a concrete
 * implementation. To swap backends (mock → IG private API → Graph API → Wax
 * native), change ONLY this file. This is how the SocialProvider abstraction
 * (docs/SPRINT.md §5) pays off operationally.
 */

import type { SocialProvider } from "./SocialProvider";
import { MockProvider } from "./MockProvider";

let active: SocialProvider | null = null;

export function getProvider(): SocialProvider {
  if (!active) {
    // Phase 0/1: mock data, zero account risk.
    // Later: active = new IGPrivateProvider();
    active = new MockProvider();
  }
  return active;
}

export type { SocialProvider } from "./SocialProvider";
export { SocialProviderError } from "./SocialProvider";
