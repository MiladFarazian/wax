import { Tabs } from "expo-router";
import { Text } from "react-native";
import { useTheme } from "@/theme/useTheme";

/**
 * Bottom tab bar. NOTE the deliberate absence of a Reels tab — the four tabs
 * mirror Instagram's layout (Home, Search, Inbox, Profile) minus Reels and the
 * center create button is reachable from Home (Phase 2). This is the core of
 * the Wax thesis (docs/SPRINT.md §3.3).
 */
function icon(glyph: string) {
  return ({ color }: { color: string }) => (
    <Text style={{ fontSize: 22, color }}>{glyph}</Text>
  );
}

export default function TabsLayout() {
  const c = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.muted,
        tabBarStyle: { backgroundColor: c.card, borderTopColor: c.hairline },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen name="index" options={{ tabBarIcon: icon("⌂") }} />
      <Tabs.Screen name="search" options={{ tabBarIcon: icon("⌕") }} />
      <Tabs.Screen name="inbox" options={{ tabBarIcon: icon("✉") }} />
      <Tabs.Screen name="profile" options={{ tabBarIcon: icon("☺") }} />
    </Tabs>
  );
}
