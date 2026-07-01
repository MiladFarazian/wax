/**
 * Stable per-install device identity for the IG private API.
 *
 * Ban-risk mitigation (docs/SPRINT.md §1, §8): the official app sends a set of
 * device identifiers that stay CONSTANT for the life of an install. Rotating
 * them per request looks like a bot and gets accounts flagged. We generate them
 * once, persist them on-device, and reuse them forever after.
 *
 * IG's write endpoints (like/follow/comment) also require `_uuid` (and often
 * `device_id`) in the body, so this is what completes the write-signing started
 * alongside `_csrftoken`/`_uid` in client.ts.
 *
 * These IDs are device fingerprints, not secrets — stability matters, not
 * unpredictability — so a non-cryptographic generator is fine. They MUST still
 * be validated on a real device (OPEN-QUESTIONS #5); exact required fields per
 * endpoint are not verified from this environment.
 */

import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

export interface IGDevice {
  /** UUIDv4 — the app's `_uuid`, stable per install. */
  uuid: string;
  /** `android-<16 hex>` — the app's `device_id`. */
  deviceId: string;
  /** A second stable UUID IG uses to group installs (`phone_id`). */
  phoneId: string;
}

const DEVICE_KEY = "wax.device.v1";
const isWeb = Platform.OS === "web";

let cached: IGDevice | null = null;

/** Non-cryptographic UUIDv4. Persisted once, so quality of randomness is moot. */
function uuidv4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
    const r = Math.floor(Math.random() * 16);
    const v = ch === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function androidDeviceId(): string {
  let hex = "";
  for (let i = 0; i < 16; i++) hex += Math.floor(Math.random() * 16).toString(16);
  return `android-${hex}`;
}

function makeDevice(): IGDevice {
  return { uuid: uuidv4(), deviceId: androidDeviceId(), phoneId: uuidv4() };
}

async function load(): Promise<IGDevice | null> {
  const raw = isWeb
    ? (globalThis.localStorage?.getItem(DEVICE_KEY) ?? null)
    : await SecureStore.getItemAsync(DEVICE_KEY);
  if (!raw) return null;
  try {
    const d = JSON.parse(raw);
    if (d?.uuid && d?.deviceId && d?.phoneId) return d as IGDevice;
    return null;
  } catch {
    return null;
  }
}

async function persist(device: IGDevice): Promise<void> {
  const raw = JSON.stringify(device);
  if (isWeb) {
    globalThis.localStorage?.setItem(DEVICE_KEY, raw);
    return;
  }
  await SecureStore.setItemAsync(DEVICE_KEY, raw);
}

/** The install's device identity, generating and persisting it on first use. */
export async function getDevice(): Promise<IGDevice> {
  if (cached) return cached;
  const existing = await load();
  if (existing) {
    cached = existing;
    return existing;
  }
  const created = makeDevice();
  await persist(created);
  cached = created;
  return created;
}
