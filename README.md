# Wax 🐝

**Silence the noise. Keep the connection.**

Wax is a calm, fast Instagram experience — without the Reels rabbit hole. Named for
the beeswax Odysseus' crew used to drown out the Sirens' song, Wax lets you keep the
people you love (feed, stories, DMs, profiles) while silencing the algorithmic noise
designed to pull you under.

It's the "Instagram minus Reels" idea done right: **faster, fairly priced, and crafted.**

## Why Wax

Apps like SocialLite proved the demand but stumbled on execution — sluggish UI,
paywalls on basics like adding the app to your home screen, and a "wrapper" feel.
Wax wins on the three things that matter:

- **Speed** — virtualized feeds, on-device caching, image prefetch, optimistic UI.
- **Fairness** — every "use Instagram normally" feature is free, forever.
- **Craft** — Instagram-1:1 inside, with a calm honey-and-wax brand at the edges.

See [docs/SPRINT.md](docs/SPRINT.md) for the full analysis and
[docs/OPEN-QUESTIONS.md](docs/OPEN-QUESTIONS.md) for open decisions.

## Screenshots

Phase 0 running on the web target with `MockProvider` sample data. Note the
four-tab bar with **no Reels tab** — the core of the Wax thesis.

| Home | Profile | Inbox | Search |
|---|---|---|---|
| ![Home feed](docs/screenshots/home.png) | ![Profile](docs/screenshots/profile.png) | ![Inbox](docs/screenshots/inbox.png) | ![Search](docs/screenshots/search.png) |

> The "Refreshing…" bar in some shots is an Expo dev-mode toast, not part of Wax.

## Stack

React Native + Expo (TypeScript) → one codebase for **iOS, Android, and web**.

- **Routing:** Expo Router (no Reels tab, by design)
- **Lists:** Shopify FlashList (60fps feeds)
- **Data/cache:** TanStack Query
- **Images:** expo-image (prefetch + blur placeholders)
- **Secure storage:** expo-secure-store (session tokens on-device only)

## Architecture: the `SocialProvider` abstraction

The UI talks only to a [`SocialProvider`](src/providers/SocialProvider.ts) interface.
The active backend is chosen in one file — [src/providers/index.ts](src/providers/index.ts) —
so Wax can swap data sources (mock → IG private API → Graph API → Wax-native network)
**without rewriting the app.** This is Wax's insurance policy against Instagram changes.

Today it runs on [`MockProvider`](src/providers/MockProvider.ts) — realistic sample
data, zero account risk — so the whole app works end-to-end out of the box.

## Getting started

```bash
npm install
npm start        # then press i (iOS), a (Android), or w (web)
npm run typecheck
```

> ⚠️ **Risk note:** the eventual unofficial-Instagram backend operates against
> Instagram's Terms of Service and can put user accounts at risk. See
> [docs/SPRINT.md §1](docs/SPRINT.md). The `SocialProvider` layer exists precisely
> so Wax can pivot if Meta changes course.

## Project layout

```
app/                 Expo Router screens (Wax shell + IG-mirror tabs)
  (tabs)/            Home · Search · Inbox · Profile   (no Reels)
src/
  providers/         SocialProvider interface + implementations
  components/        Shared UI (PostCard, …)
  lib/               Query client, data hooks, secure session
  theme/             Wax design tokens (honey/wax brand)
  types/             Domain models (note: no Reel type)
docs/                SPRINT.md, OPEN-QUESTIONS.md
```
