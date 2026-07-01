/**
 * The Reels filter — where Wax's whole reason for existing is enforced.
 *
 * Decision (OPEN-QUESTIONS #7): remove the Reels tab/create flow AND drop any
 * feed/Explore item Instagram tags as a Reel. Instagram marks Reels with
 * `product_type: "clips"` (and, on some payloads, `media_type` + clips metadata).
 * Stories and ordinary in-feed video are KEPT.
 *
 * Keeping this in one tiny module means the rule is auditable and the rest of
 * the app never has to know how IG labels a Reel.
 */

/** Minimal shape of the IG media fields we inspect. */
export interface IGRawMediaLike {
  product_type?: string;
  media_type?: number;
  clips_metadata?: unknown;
}

/** True if Instagram considers this media a Reel and Wax should hide it. */
export function isReel(media: IGRawMediaLike): boolean {
  if (media.product_type === "clips") return true;
  // Defensive: some payloads omit product_type but carry clips metadata.
  if (media.clips_metadata != null) return true;
  return false;
}

/** Remove all Reels from a list of raw IG media items. */
export function stripReels<T extends IGRawMediaLike>(items: T[]): T[] {
  return items.filter((m) => !isReel(m));
}
