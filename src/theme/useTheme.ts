import { useColorScheme } from "react-native";
import { theme, type ThemeColors } from "./tokens";

/** Returns the active Wax color set based on the device's light/dark setting. */
export function useTheme(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === "dark" ? theme.dark : theme.light;
}
