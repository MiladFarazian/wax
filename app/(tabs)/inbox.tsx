import { useMemo } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useConversations, useProfile } from "@/lib/hooks";
import { useIG } from "@/theme/ig";
import { timeAgo } from "@/lib/time";
import type { Conversation } from "@/types/social";

/** Direct messages — Instagram's DM inbox, mirrored (SPRINT §3.3). */
export default function Inbox() {
  const c = useIG();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const convos = useConversations();
  const me = useProfile("u_me");

  const items = useMemo<Conversation[]>(
    () => convos.data?.pages.flatMap((p) => p.items) ?? [],
    [convos.data],
  );

  return (
    <View style={[styles.root, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.topBar}>
        <View style={styles.nameRow}>
          <Text style={[styles.title, { color: c.text }]}>{me.data?.username ?? "you"}</Text>
          <Ionicons name="chevron-down" size={16} color={c.icon} />
        </View>
        <Ionicons name="create-outline" size={26} color={c.icon} />
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={[styles.field, { backgroundColor: c.inputBg }]}>
          <Ionicons name="search" size={17} color={c.secondary} />
          <TextInput placeholder="Search" placeholderTextColor={c.secondary} style={[styles.input, { color: c.text }]} />
        </View>
      </View>

      <FlashList
        data={items}
        keyExtractor={(x) => x.id}
        estimatedItemSize={72}
        onEndReached={() => convos.hasNextPage && convos.fetchNextPage()}
        renderItem={({ item }) => {
          const other = item.participants.find((p) => p.id !== "u_me") ?? item.participants[0];
          return (
            <Pressable style={styles.row} onPress={() => router.push(`/dm/${item.id}`)}>
              <Image source={other.avatarUrl} style={styles.avatar} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: c.text, fontWeight: item.unread ? "600" : "400" }]}>
                  {other.username}
                </Text>
                <View style={styles.previewRow}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.preview,
                      { color: item.unread ? c.text : c.secondary, fontWeight: item.unread ? "500" : "400", flexShrink: 1 },
                    ]}
                  >
                    {item.lastMessagePreview}
                  </Text>
                  <Text style={[styles.preview, { color: c.secondary }]}> · {timeAgo(item.updatedAt)}</Text>
                </View>
              </View>
              {item.unread ? <View style={[styles.unread, { backgroundColor: c.link }]} /> : null}
              <Ionicons name="camera-outline" size={24} color={c.icon} />
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    height: 44,
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  title: { fontSize: 20, fontWeight: "700" },
  searchWrap: { paddingHorizontal: 12, paddingBottom: 8 },
  field: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, paddingHorizontal: 12, height: 36 },
  input: { flex: 1, fontSize: 15, padding: 0 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  name: { fontSize: 15 },
  previewRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  preview: { fontSize: 14 },
  unread: { width: 8, height: 8, borderRadius: 4 },
});
