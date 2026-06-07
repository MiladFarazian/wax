# Wax — Sprint 0: Analysis, Strategy & Build Plan

> **Wax** — A calm, fast Instagram experience without the Reels rabbit hole.
> Named for the beeswax Odysseus' crew used to drown out the Sirens' song —
> Wax lets you keep the connection (feed, friends, DMs, stories) while
> silencing the algorithmic noise designed to pull you under.

- **Status:** Draft for review
- **Date:** 2026-06-07
- **Owner:** Milad
- **Stack decision:** React Native + Expo (one TypeScript codebase → iOS, Android, web)
- **Integration decision:** Unofficial Instagram access (mirror IG 1:1, minus Reels) — _see §1 risk before locking this in_

---

## 0. TL;DR

SocialLite proved there is real demand for **"Instagram minus Reels."** It works, and
it's surprisingly close to the real thing — but its **execution undercuts the promise**:
it's slow, it nickel-and-dimes users for basics (e.g. paywalling Add-to-Home-Screen),
and it feels like a wrapper rather than a product.

**Wax's thesis:** keep the 1:1 Instagram feature parity that makes SocialLite compelling,
but win on the three things SocialLite gets wrong — **speed, fair pricing, and craft
(look & feel)** — wrapped in a distinct, calming brand (the Wax / Sirens story).

This doc covers:
1. The strategic & legal reality of unofficial IG access (must-read)
2. A teardown of SocialLite's specific flaws
3. How Wax beats each flaw
4. Brand & design direction (Wax / Odysseus)
5. Architecture for a future iOS + Android app
6. Phased build plan
7. Success metrics

A companion doc — [`OPEN-QUESTIONS.md`](./OPEN-QUESTIONS.md) — lists everything I need
decisions on before/while building.

---

## 1. The Elephant: Unofficial IG Access (read first)

You chose to mirror Instagram 1:1 via **unofficial access**, the same approach SocialLite uses.
This is the right call for product-market fit, but it carries existential risk that must
shape the architecture from day one.

### Why SocialLite can operate even though it violates IG's ToS
- It uses Instagram's **private/internal API** (the same endpoints the official app uses),
  logging in **as the user** with their credentials. Forbidden ≠ blocked — requests work
  until Meta detects and stops them.
- Enforcement is usually **account-level** (Meta flags/locks suspicious logins), so the
  **user** bears most of the risk, not the developer.
- Meta **selectively enforces.** Small clients fly under the radar for years; popular ones
  get a cease-and-desist, an API change that breaks them overnight, or an App Store takedown.
- "It's live today" = "not targeted yet," **not** "safe." Many predecessors were killed.

### What this means for Wax (design consequences)
- **Risk is real and inherited.** Meta can break Wax with one API change or one C&D, and
  **users' IG accounts can be flagged/banned.** This must be disclosed to users in-app.
- **Mitigation = abstraction.** Build a hard **`SocialProvider` interface** (see §5) so the
  IG-private-API implementation is one swappable module. If Meta pulls the rug, Wax can
  pivot to (a) the official Graph API for what it supports, or (b) **Wax's own backend /
  standalone network** without rewriting the app.
- **Operational hygiene to reduce ban risk:** human-like request pacing/rate-limiting,
  realistic device/session fingerprints, no aggressive scraping, secure on-device credential
  storage, and never routing creds through our servers if avoidable (on-device / per-user
  session tokens).
- **Legal posture:** clear ToS + disclaimer that Wax is unaffiliated with Meta/Instagram,
  that users use it at their own account risk, and an LLC/entity separation before launch.
  _(Get actual legal counsel before public launch — flagged in Open Questions.)_

> **Bottom line:** ship the IG-mirror to win users, but architect as if Meta will try to
> kill it — because eventually they might. The abstraction layer is non-negotiable.

---

## 2. SocialLite Teardown — What's Wrong

Ranked by how much they hurt the product and how cleanly Wax can beat them.

### 2.1 Performance / Speed (the #1 complaint)
- **Symptom:** sluggish interface, slow feed loads, janky scrolling, laggy navigation.
- **Likely causes:** thin wrapper over web/private API with no real caching layer;
  re-fetching on every view; no image prefetch/CDN strategy; heavy synchronous work on
  the main thread; no list virtualization tuning.
- **Why it matters:** speed *is* the product for a "lite/calm" client. If it's slower than
  Instagram itself, the core promise is broken.

### 2.2 Predatory / nonsensical paywall
- **Symptom:** paywalling trivial, expected features — e.g. **adding the app to the home
  screen**, or other basics that cost the developer nothing.
- **Why it matters:** it signals extraction, not value. Users tolerate paying for *premium*
  capability, not for *removing artificial friction*. This is the easiest reputational win
  for Wax to take.

### 2.3 "Wrapper" feel — not quite Instagram
- **Symptom:** "impressed how close it is, but still not quite." Small UX gaps: spacing,
  animations, gesture parity, transitions, empty/loading states, haptics, polish.
- **Why it matters:** the uncanny-valley gap is exactly where a craft-focused competitor wins.

### 2.4 Weak/absent brand & identity
- **Symptom:** functional but generic; no memorable point of view.
- **Why it matters:** "IG without Reels" is a feature, not a brand. Wax has a *story*
  (Sirens/beeswax) that gives it identity and a reason to be loved, not just used.

### 2.5 Trust & transparency gaps
- **Symptom:** unclear handling of credentials, unclear account-ban risk, unclear data use.
- **Why it matters:** you're asking users to log in with their real IG account. Trust is
  the whole ballgame; transparency is a differentiator.

---

## 3. How Wax Wins — Issue by Issue

| # | SocialLite flaw | Wax's answer | How we measure it |
|---|---|---|---|
| 1 | Slow interface | Aggressive on-device caching, image prefetch + CDN, virtualized feeds, optimistic UI, 60fps target | Cold feed < 1.5s; scroll at 60fps; warm nav < 100ms |
| 2 | Predatory paywall | **All core IG-parity features free.** Charge only for genuine premium (multi-account, advanced filters/mute, themes, scheduling) | Free tier covers 100% of "use IG normally" |
| 3 | Wrapper feel | Pixel + motion parity pass; native gestures, haptics, shared-element transitions, polished empty/loading states | Side-by-side parity checklist ≥ 95% |
| 4 | No brand | The Wax / Sirens identity: calm, focused, "noise-cancelled" social | Distinct visual identity & voice |
| 5 | Trust gaps | Transparent ToS, in-app risk disclosure, on-device credential storage, clear data policy | Security review passes; no creds on our servers |

### 3.1 Speed playbook (concrete)
- **Caching:** persistent local cache (feed, profiles, media metadata) so repeat views are instant.
- **Images:** CDN-backed, progressive/blur-up loading, prefetch next N posts, correct sizing.
- **Lists:** virtualized lists (FlashList) tuned for IG-style feeds; recycle views aggressively.
- **Optimistic UI:** likes/comments/follows reflect instantly, reconcile in background.
- **Thread discipline:** keep parsing/transform work off the UI thread; debounce network.
- **Perception:** skeletons, instant tab switches, no blocking spinners on cached data.

### 3.2 Pricing philosophy
- **Free forever:** feed, stories, posting, DMs, profiles, search, explore-without-Reels —
  the full "use Instagram normally" surface. **Add-to-home-screen and any install/setup
  step is always free.**
- **Wax+ (optional paid):** multi-account, advanced mute/keyword filters, custom themes,
  scheduled posts, larger cache/offline, priority support. Things that add capability,
  never things that remove artificial friction.

### 3.3 "1:1 Instagram, minus Reels" — feature parity scope
Mirror these exactly (look & behavior):
- Home **feed** (posts, carousels, photos/videos) — _Reels removed from feed & nav_
- **Stories** (view, post, reply)
- **DMs / inbox** (text, media, reactions)
- **Profiles** (grid, highlights, follow/unfollow, edit profile)
- **Search & Explore** — _Reels-only surfaces removed; keep photo/post discovery_
- **Posting** (single, carousel, captions, tags, location)
- **Notifications / activity**
- **Likes, comments, saves, shares**

Explicitly **removed/neutralized:** Reels tab, Reels in feed, Reels in Explore, the Reels
create flow. (This is the entire point of Wax.)

---

## 4. Brand & Design Direction — Wax / Odysseus

**Story:** Odysseus' crew filled their ears with beeswax to pass the Sirens unharmed.
Wax = the beeswax for the algorithmic Sirens. You stay connected to the people you love,
without the endless, designed-to-addict pull of Reels.

**Brand attributes:** calm, focused, warm, premium, quiet confidence. The *anti-doomscroll*.

**Design language (Wax shell — NOT the in-app IG mirror):**
- **Palette:** warm honey/amber + deep wax-cream + a calm dark mode. Honey gold as the
  signature accent; muted, low-stimulation neutrals (the opposite of attention-grabbing).
- **Logo/mark:** a wax seal / honeycomb / honey-drop motif; soft, tactile.
- **Typography:** a humanist, calm typeface; generous spacing; nothing shouty.
- **Motion:** smooth, gentle, intentional — never frenetic. Motion communicates calm.
- **Voice:** reassuring and clear ("Silence the noise. Keep the connection.").

> **Important boundary:** The **Wax brand** applies to the *shell* — onboarding, login,
> settings, paywall, splash, app icon, empty states. **Inside** the social experience,
> the UI **mirrors Instagram 1:1** for familiarity. Brand lives at the edges; the core
> feels like home. (Confirm exact balance in Open Questions.)

---

## 5. Architecture — Built for Mobile (iOS + Android)

**Stack:** React Native + **Expo** (TypeScript). One codebase → iOS, Android, and web.
Rationale: fastest path to real mobile apps, OTA updates, huge ecosystem, easy hiring,
and web fallout for free.

### 5.1 High-level layers
```
┌─────────────────────────────────────────────┐
│  UI Layer (React Native + Expo)              │
│  - Wax shell (brand) + IG-mirror screens     │
│  - FlashList feeds, Reanimated motion        │
├─────────────────────────────────────────────┤
│  State / Data Layer                          │
│  - TanStack Query (cache, optimistic UI)     │
│  - Local persistence (MMKV / SQLite)         │
├─────────────────────────────────────────────┤
│  SocialProvider interface  ◄── KEY ABSTRACTION│
│  - getFeed(), getStories(), sendDM(), post() │
│  - Reels endpoints intentionally unimplemented│
├──────────────┬───────────────┬──────────────┤
│ IGPrivate    │ IGGraphAPI    │ WaxBackend    │
│ Provider     │ Provider      │ Provider      │
│ (now)        │ (fallback)    │ (future/own)  │
└──────────────┴───────────────┴──────────────┘
```

### 5.2 The `SocialProvider` interface (why it matters)
A single TypeScript interface every data source must implement. Today: `IGPrivateProvider`
(unofficial IG access). If Meta breaks/bans it, swap in `IGGraphAPIProvider` or
`WaxBackendProvider` **without touching the UI.** This is our insurance policy from §1.

### 5.3 Recommended building blocks
- **Navigation:** Expo Router / React Navigation (tab + stack; **no Reels tab**).
- **Lists:** Shopify **FlashList** (performance-critical for feeds).
- **Animation/gesture:** Reanimated + Gesture Handler (IG-parity gestures, shared transitions).
- **Data:** TanStack Query + **MMKV** (fast key-value cache) and/or SQLite for larger sets.
- **Images:** `expo-image` (caching, blurhash/placeholder, prefetch).
- **Secure storage:** `expo-secure-store` / Keychain/Keystore for IG session tokens —
  **on-device, never on our servers** where possible.
- **Backend (only if/when needed):** start serverless (Supabase/Firebase) for accounts,
  Wax+ entitlements, and the future WaxBackend network. Keep IG creds out of it.
- **Payments:** RevenueCat over App Store / Play billing for Wax+.
- **Builds/CI:** EAS Build + EAS Update (OTA).

### 5.4 Performance is an architectural requirement, not a polish step
The §3.1 speed playbook is wired into these choices (FlashList, MMKV, expo-image prefetch,
TanStack Query optimistic updates). Speed is the brand promise — treat regressions as bugs.

---

## 6. Build Plan — Phased

### Phase 0 — Foundations (this sprint)
- [ ] Lock decisions in [`OPEN-QUESTIONS.md`](./OPEN-QUESTIONS.md)
- [ ] Confirm IG-access approach + legal disclaimer language (see §1)
- [ ] Expo + TypeScript app scaffold; navigation skeleton (no Reels tab)
- [ ] Define `SocialProvider` interface (the abstraction from §5.2)
- [ ] Design tokens: Wax palette, type, spacing, motion primitives
- [ ] Brand v0: name lockup, app icon, splash, login/onboarding mocks

### Phase 1 — Auth + Read-only feed (proof of value)
- [ ] IG login flow (secure, on-device token storage, risk disclosure screen)
- [ ] `IGPrivateProvider`: `getFeed()`, `getProfile()`
- [ ] Home feed (FlashList) with caching + image prefetch — **must out-perform SocialLite**
- [ ] Profile screen (grid, header)
- [ ] Performance baseline measured vs. targets (§3 table)

### Phase 2 — Core IG parity
- [ ] Stories (view + post)
- [ ] DMs / inbox
- [ ] Likes, comments, saves, follow/unfollow (optimistic UI)
- [ ] Search + Explore (Reels surfaces stripped)
- [ ] Posting flow (single + carousel)
- [ ] Notifications/activity

### Phase 3 — Craft & parity polish
- [ ] Gesture/motion parity pass (transitions, haptics, shared elements)
- [ ] Empty/loading/error states polished
- [ ] Dark mode; accessibility pass
- [ ] Side-by-side IG parity checklist ≥ 95%

### Phase 4 — Monetization & launch prep
- [ ] Wax+ entitlements (RevenueCat) — **core stays free**
- [ ] ToS, privacy policy, in-app risk disclosure finalized (legal review)
- [ ] EAS builds, TestFlight / Play internal testing
- [ ] Resilience drill: simulate IG provider failure → confirm clean degraded state

### Phase 5 — Future-proofing
- [ ] `IGGraphAPIProvider` fallback stub
- [ ] `WaxBackendProvider` design (Wax's own network as escape hatch / expansion)

---

## 7. Success Metrics

**Speed (the differentiator)**
- Cold feed load < 1.5s; warm/cached views feel instant (< 100ms nav)
- Sustained 60fps scrolling on mid-tier devices

**Fairness**
- 100% of "use Instagram normally" features are free
- Zero paywalls on setup/install/home-screen steps

**Craft**
- IG parity checklist ≥ 95%
- Crash-free sessions > 99.5%

**Trust**
- Credentials stored on-device; security review passed
- Clear, upfront risk disclosure; transparent data policy

**North star:** users describe Wax as *"Instagram, but calmer and faster"* — and never
feel nickel-and-dimed.

---

## 8. Key Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Meta breaks private API / sends C&D | Medium-High | Critical | `SocialProvider` abstraction; Graph API + own-backend fallbacks (§5) |
| Users' IG accounts get flagged/banned | Medium | High | Human-like pacing, realistic sessions, upfront disclosure |
| App Store / Play takedown | Medium | High | Legal entity separation, clean ToS, web/PWA fallback channel |
| Performance not meaningfully better than SocialLite | Low-Med | High | Perf is architectural (§5.4); measure every phase |
| Scope creep chasing exact IG parity | High | Medium | Parity checklist + phased plan; "minus Reels" keeps scope honest |

---

_See [`OPEN-QUESTIONS.md`](./OPEN-QUESTIONS.md) for decisions needed before/while building._
