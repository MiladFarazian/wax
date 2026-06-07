# Wax — Open Questions & Clarifications

> Decisions and clarifications I need to tighten the initial build & scope.
> Grouped by theme. Each has my **recommendation** so we can move fast — just
> confirm or override. Companion to [`SPRINT.md`](./SPRINT.md).

Legend: ⭐ = my recommended default · ❗ = blocking (needed before building that part) · ✅ = decided

---

## ✅ Decisions locked (2026-06-07)

These were confirmed and now drive Phase 1 (the real `IGPrivateProvider`):

- **#1 IG access:** Unofficial Instagram access, behind the swappable `SocialProvider`.
- **#3 Auth mechanism:** **Session-token import** — user logs into real Instagram
  (webview), Wax captures and reuses the resulting session token. Lowest ban risk;
  Wax never handles raw passwords. _(Supersedes the old ⭐ in #3.)_
- **#2 Token storage:** **On-device only** (Keychain/Keystore via `expo-secure-store`);
  never synced to any Wax server.
- **#7 Reels definition:** Remove the Reels tab/create flow **and** filter out any feed/
  Explore item Instagram tags as a Reel (`product_type: "clips"`). Keep Stories and
  normal in-feed video.

Still open / using ⭐ defaults until you say otherwise: #4, #5, #6, #8–#27.

---

## A. Integration & Legal (highest stakes — see Sprint §1)

1. ❗ **IG access method confirmed?** You chose unofficial/private-API access.
   Confirm you accept the inherited risk (Meta can break/ban; user accounts at risk).
   ⭐ Proceed, **but** build the `SocialProvider` abstraction so we can pivot.

2. ❗ **Where do IG credentials live?**
   ⭐ On-device only (Keychain/Keystore), never on our servers. Confirm acceptable.

3. **Login mechanism** — username/password capture, or official OAuth where possible,
   or session-token import? (Affects ban risk & UX.) ⭐ On-device login, human-like pacing.

4. **Legal entity & counsel** — do you have/plan an LLC before public launch? Do you want
   me to draft *placeholder* ToS / privacy / risk-disclosure copy for later legal review?
   ⭐ I draft placeholders; you get real counsel before public launch.

5. **Account-ban tolerance** — if early testers get IG accounts flagged, does that change
   the plan? (Test with throwaway IG accounts first?) ⭐ Yes — test on burner accounts.

---

## B. Scope & Feature Parity

6. **Brand-vs-mirror balance** — Sprint §4 proposes: Wax brand on the *shell*
   (onboarding/login/settings/paywall/icon), Instagram-1:1 *inside* the social experience.
   ⭐ Confirm this split, or tell me how much Wax styling you want inside the feed.

7. **Reels definition** — strip only the Reels *tab/create flow*, or also hide any
   video-in-feed that IG classifies as Reels? What about Stories video and normal feed
   video? ⭐ Remove Reels tab + Reels-in-feed/Explore; keep Stories & normal feed video.

8. **MVP surface** — which is the v1 "wow"? ⭐ A blazing-fast **read-only feed + profiles**
   first (proves the speed promise), then DMs/stories/posting. Agree?

9. **Posting in v1?** Full create flow is heavy. ⭐ Defer posting to Phase 2; v1 = consume + interact.

10. **Explore/Search** — keep full Explore (minus Reels) or simplify to search-only for v1?
    ⭐ Search-only in v1, full Explore in Phase 2.

11. **Ads in feed** — IG injects sponsored posts via the API. Show them, or attempt to
    filter? (Filtering may increase ban risk / break the feed.) ⭐ Show as-is for v1; revisit.

---

## C. Monetization

12. **Pricing model** — confirm: **core free**, optional **Wax+** for genuine premium
    (multi-account, advanced mute/filters, themes, scheduling, offline). ⭐ Yes.

13. **Wax+ price point & trial?** e.g. $2.99–$4.99/mo with a free trial — your target?
    ⭐ $3.99/mo or $29.99/yr, 7-day trial. (Adjust to taste.)

14. **Absolute free guarantees** — confirm these are *never* paywalled: add-to-home-screen,
    login/setup, basic feed/DMs/stories/posting. ⭐ Yes — this is core positioning.

---

## D. Design & Brand

15. **Palette** — go with honey/amber + wax-cream + calm dark mode? Any colors you love/hate?
    ⭐ Honey gold accent, low-stimulation neutrals.

16. **Logo direction** — wax seal / honeycomb / honey-drop? Do you want me to generate a few
    concept directions, or do you have a designer? ⭐ I produce v0 concepts to react to.

17. **Tagline** — e.g. "Silence the noise. Keep the connection." Want options? ⭐ I'll draft 5.

18. **App name final** — "Wax" confirmed for stores, or a longer store name
    (e.g. "Wax — Social, without the noise")? ⭐ "Wax" + descriptive subtitle.

---

## E. Tech & Platform

19. ❗ **Stack confirmed:** React Native + Expo + TypeScript. ⭐ Yes (your choice).

20. **Launch platform order** — iOS first, Android first, or both together? Web/PWA in the
    mix as a fallback channel? ⭐ iOS first (TestFlight), Android close behind, web as fallback.

21. **Backend now or later?** We can stay client-only until Wax+ accounts/entitlements are
    needed. ⭐ Client-only until Phase 4; then Supabase/Firebase + RevenueCat.

22. **Analytics/telemetry** — do you want privacy-respecting product analytics (to measure
    the speed/parity metrics)? ⭐ Yes, privacy-first (e.g. PostHog), no PII.

23. **Repo structure** — single Expo app now; monorepo later if we add a backend? ⭐ Single app now.

---

## F. Team, Timeline & Process

24. **Who's building?** Just you + me, or a team? (Affects how much I scaffold vs. document.)

25. **Target timeline** for a private TestFlight beta? ⭐ Phases 0–1 first, then reassess.

26. **Design assets** — do you have access to a designer/Figma, or should I lean on
    code-defined design tokens + AI-generated concept art for branding?

27. **What does "done" look like for *this* sprint?** ⭐ These two docs reviewed + decisions
    locked, then I scaffold the Expo app and `SocialProvider` interface (Phase 0).

---

## G. Things I'm assuming unless you say otherwise

- We mirror **public Instagram behavior**, not internal/employee features.
- We will **not** attempt to defeat Meta security beyond normal client behavior (lower ban risk).
- No data resale; analytics are privacy-first.
- "1:1 with Instagram" means **familiar UX**, not copying proprietary assets/logos/code
  (we build look-alike components, not pirated ones — important for App Store + legal).

---

### How to use this doc
Reply with the numbers you want to change (e.g. "13: $4.99/mo, 20: both platforms").
Anything you don't mention, I'll proceed with the ⭐ recommendation.
**Blocking items (❗): 1, 2, 6→8, 19** — I need these before Phase 1 build.
