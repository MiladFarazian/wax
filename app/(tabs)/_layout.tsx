import { Tabs } from "expo-router";
import { View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useProfile } from "@/lib/hooks";
import { useIG } from "@/theme/ig";

/**
 * Bottom tab bar, mirrored from Instagram (docs/SPRINT.md §4): line icons that
 * fill when active, over a white/black bar with a hairline top border. NOTE the
 * deliberate absence of a Reels tab — Home, Search, Inbox (DMs), Profile — the
 * core of the Wax thesis (§3.3). The profile tab is the user's avatar, like IG.
 */
type IoniconName = keyof typeof Ionicons.glyphMap;

function tabIcon(outline: IoniconName, filled: IoniconName) {
  return ({ color, focused, size }: { color: string; focused: boolean; size: number }) => (
    <Ionicons name={focused ? filled : outline} size={size ?? 26} color={color} />
  );
}

/** Profile tab shows the logged-in user's avatar with a ring when active. */
function ProfileTabIcon({ color, focused }: { color: string; focused: boolean }) {
  const me = useProfile("u_me");
  return (
    <View
      style={{
        width: 26,
        height: 26,
        borderRadius: 13,
        borderWidth: focused ? 2 : 1,
        borderColor: color,
        overflow: "hidden",
      }}
    >
      <Image source={me.data?.avatarUrl} style={{ width: "100%", height: "100%" }} contentFit="cover" />
    </View>
  );
}

export default function TabsLayout() {
  const c = useIG();
  return (
    <Tabs
      screenListeners={{
        tabPress: () => {
          Haptics.selectionAsync().catch(() => {});
        },
      }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.icon,
        tabBarInactiveTintColor: c.icon,
        tabBarStyle: {
          backgroundColor: c.tabBar,
          borderTopColor: c.separator,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen name="index" options={{ tabBarIcon: tabIcon("home-outline", "home") }} />
      <Tabs.Screen name="search" options={{ tabBarIcon: tabIcon("search-outline", "search") }} />
      <Tabs.Screen
        name="inbox"
        options={{ tabBarIcon: tabIcon("paper-plane-outline", "paper-plane") }}
      />
      <Tabs.Screen name="profile" options={{ tabBarIcon: ProfileTabIcon }} />
    </Tabs>
  );
}
