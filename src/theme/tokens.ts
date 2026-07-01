/**
 * Wax design tokens (see docs/SPRINT.md §4).
 *
 * The Wax brand — beeswax against the Sirens' noise — is calm, warm, and
 * low-stimulation: honey/amber accents over wax-cream, plus a calm dark mode.
 * These tokens style the Wax SHELL (onboarding, settings, splash). Inside the
 * social experience we mirror Instagram's neutral UI for familiarity.
 */

export const palette = {
  // Signature
  honey: "#E0A422", // primary accent — warm honey gold
  honeyDeep: "#B97E10",
  amber: "#F2C14E",

  // Light (wax-cream) surfaces
  waxCream: "#F6EBD3",
  waxCard: "#FFFFFF",
  inkLight: "#1A1814",
  mutedLight: "#6E6657",

  // Dark (calm) surfaces — warm-tinted, not harsh black
  waxNightBg: "#15130F",
  waxNightCard: "#1F1C16",
  inkDark: "#F2EDE2",
  mutedDark: "#9C9484",

  // System
  hairline: "rgba(0,0,0,0.08)",
  hairlineDark: "rgba(255,255,255,0.10)",
  danger: "#D9534F",
} as const;

export const theme = {
  light: {
    bg: palette.waxCream,
    card: palette.waxCard,
    text: palette.inkLight,
    muted: palette.mutedLight,
    accent: palette.honey,
    hairline: palette.hairline,
    danger: palette.danger,
  },
  dark: {
    bg: palette.waxNightBg,
    card: palette.waxNightCard,
    text: palette.inkDark,
    muted: palette.mutedDark,
    accent: palette.amber,
    hairline: palette.hairlineDark,
    danger: palette.danger,
  },
} as const;

export type ThemeColors = { [K in keyof (typeof theme)["light"]]: string };

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 8, md: 12, lg: 20, pill: 999 } as const;

export const type = {
  // Calm, humanist scale — generous, never shouty.
  display: { fontSize: 34, fontWeight: "700" as const, letterSpacing: 0.3 },
  title: { fontSize: 22, fontWeight: "700" as const },
  body: { fontSize: 15, fontWeight: "400" as const },
  caption: { fontSize: 13, fontWeight: "400" as const },
  label: { fontSize: 13, fontWeight: "600" as const },
} as const;
