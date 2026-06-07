import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useConversations } from "@/lib/hooks";
import { useTheme } from "@/theme/useTheme";
import { spacing, type } from "@/theme/tokens";
import type { Conversation } from "@/types/social";

/** Direct messages inbox — IG-style conversation list (docs/SPRINT.md §3.3). */
export default function Inbox() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const convos = useConversations();

  const items = useMemo<Conversation[]>(
    () => convos.data?.pages.flatMap((p) => p.items) ?? [],
    [convos.data],
  );

  return (
    <View style={[styles.root, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <Text style={[type.title, { color: c.text, padding: spacing.md }]}>Messages</Text>
      <FlashList
        data={items}
        keyExtractor={(x) => x.id}
        estimatedItemSize={72}
        onEndReached={() => convos.hasNextPage && convos.fetchNextPage()}
        renderItem={({ item }) => {
          const other = item.participants.find((p) => p.id !== "u_me") ?? item.participants[0];
          return (
            <View style={styles.row}>
              <Image source={other.avatarUrl} style={styles.avatar} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <Text style={[type.label, { color: c.text }]}>{other.username}</Text>
                <Text numberOfLines={1} style={[type.caption, { color: c.muted }]}>
                  {item.lastMessagePreview}
                </Text>
              </View>
              {item.unread ? <View style={[styles.dot, { backgroundColor: c.accent }]} /> : null}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
