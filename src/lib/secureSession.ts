/**
 * Secure on-device session storage.
 *
 * Per docs/SPRINT.md §1 & §5, Wax keeps the IG session token in the device's
 * Keychain/Keystore and NEVER on our servers. This wrapper centralizes that so
 * the rest of the app can't accidentally persist credentials elsewhere.
 *
 * Platform note: expo-secure-store is native-only (it has no web backend). On
 * web we fall back to localStorage purely so the dev/preview build runs — web
 * is NOT a secure target and is not a shipping surface for real IG sessions.
 */

import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "wax.session.token";

const isWeb = Platform.OS === "web";

export async function saveSessionToken(token: string): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function loadSessionToken(): Promise<string | null> {
  if (isWeb) {
    return globalThis.localStorage?.getItem(TOKEN_KEY) ?? null;
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearSessionToken(): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.removeItem(TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
