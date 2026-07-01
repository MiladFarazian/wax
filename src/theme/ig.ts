/**
 * Instagram-mirror theme (docs/SPRINT.md §4).
 *
 * The Wax brand (honey/cream, see tokens.ts) styles the SHELL — login, splash,
 * settings. INSIDE the social experience we mirror Instagram 1:1 so it feels
 * like home: white/black surfaces, IG's exact grays and blues, the red like and
 * the story-ring gradient. Everything in app/(tabs) and the feed components uses
 * this, not the Wax palette.
 */

import { Platform, useColorScheme } from "react-native";

export interface IGColors {
  bg: string;
  text: string;
  secondary: string;
  separator: string;
  icon: string;
  link: string;
  like: string;
  inputBg: string;
  tabBar: string;
}

export const ig: { light: IGColors; dark: IGColors } = {
  light: {
    bg: "#FFFFFF",
    text: "#000000",
    secondary: "#8E8E8E", // captions, timestamps, placeholder
    separator: "#DBDBDB", // hairlines, seen story ring
    icon: "#262626", // near-black glyphs
    link: "#0095F6", // IG blue — links, active dots, primary buttons
    like: "#ED4956", // IG red heart
    inputBg: "#EFEFEF", // search field
    tabBar: "#FFFFFF",
  },
  dark: {
    bg: "#000000",
    text: "#FFFFFF",
    secondary: "#A8A8A8",
    separator: "#262626",
    icon: "#FFFFFF",
    link: "#0095F6",
    like: "#ED4956",
    inputBg: "#1C1C1C",
    tabBar: "#000000",
  },
};

/** IG colors for the active light/dark scheme. */
export function useIG(): IGColors {
  return useColorScheme() === "dark" ? ig.dark : ig.light;
}

/** Instagram's story-ring gradient (unseen state), bottom-left → top-right. */
export const STORY_GRADIENT = ["#feda75", "#fa7e1e", "#d62976", "#962fbf", "#4f5bd5"] as const;

/**
 * The wordmark style that stands in for IG's script logo at the top of the feed.
 * We render "Wax" (never Meta's trademarked logo — docs/OPEN-QUESTIONS §G) in a
 * platform cursive so the header reads like Instagram's while staying our own.
 */
export const wordmark = Platform.select({
  ios: { fontFamily: "Snell Roundhand", fontWeight: "700" as const },
  default: { fontFamily: "serif", fontStyle: "italic" as const, fontWeight: "700" as const },
});
