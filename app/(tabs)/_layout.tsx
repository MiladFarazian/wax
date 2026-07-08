import { Tabs, useRouter, type Href } from "expo-router";
import { View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useProfile } from "@/lib/hooks";
import { useIG } from "@/theme/ig";

/**
 * Bottom tab bar, mirrored from Instagram: Home · Search · Create(+) · Profile —
 * Instagram's exact bar with the Reels tab removed (the one and only difference).
 * DMs live top-right and slide in, like IG. Icons fill when active; the profile
 * tab is the user's avatar.
 */
type IoniconName = keyof typeof Ionicons.glyphMap;

function tabIcon(outline: IoniconName, filled: IoniconName, iconSize = 26) {
  return ({ color, focused, size }: { color: string; focused: boolean; size: number }) => (
    <Ionicons name={focused ? filled : outline} size={size ?? iconSize} color={color} />
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
  const router = useRouter();
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
        name="create"
        options={{ tabBarIcon: tabIcon("add-outline", "add", 30) }}
        listeners={{
          // Open the create modal instead of switching to the (empty) tab.
          tabPress: (e) => {
            e.preventDefault();
            router.push("/new-post" as Href);
          },
        }}
      />
      <Tabs.Screen name="profile" options={{ tabBarIcon: ProfileTabIcon }} />
    </Tabs>
  );
}
