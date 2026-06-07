/**
 * Secure on-device session storage.
 *
 * Per docs/SPRINT.md §1 & §5, Wax keeps the IG session token in the device's
 * Keychain/Keystore and NEVER on our servers. This wrapper centralizes that so
 * the rest of the app can't accidentally persist credentials elsewhere.
 */

import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "wax.session.token";

export async function saveSessionToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function loadSessionToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearSessionToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
