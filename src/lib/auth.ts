/**
 * Auth controller — bridges the on-device session token to the active provider.
 *
 * Flow (session-token import, per docs/OPEN-QUESTIONS.md):
 *   1. App launches → restore() reads the stored token and asks the provider to
 *      adopt it (restoreSession).
 *   2. User completes the IG login webview → completeLogin(token) stores it
 *      on-device and adopts it.
 *   3. signOut() clears both the provider and on-device storage.
 *
 * The token never leaves the device (it lives only in Keychain/Keystore).
 */

import { getProvider, activeBackend } from "@/providers";
import {
  clearSessionToken,
  loadSessionToken,
  saveSessionToken,
} from "./secureSession";

export type AuthStatus = "loading" | "signed_out" | "signed_in";

export async function restore(): Promise<AuthStatus> {
  // The mock backend is always "signed in" for frictionless dev.
  if (activeBackend() === "mock") {
    await getProvider().restoreSession("mock-token");
    return "signed_in";
  }
  const token = await loadSessionToken();
  if (!token) return "signed_out";
  const session = await getProvider().restoreSession(token);
  if (!session) {
    await clearSessionToken();
    return "signed_out";
  }
  return "signed_in";
}

/** Called by the login webview once it captures the IG sessionid. */
export async function completeLogin(token: string): Promise<AuthStatus> {
  const session = await getProvider().restoreSession(token);
  if (!session) return "signed_out";
  await saveSessionToken(token);
  return "signed_in";
}

export async function signOut(): Promise<void> {
  await getProvider().logout();
  await clearSessionToken();
}
