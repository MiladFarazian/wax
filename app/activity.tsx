import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useActivity } from "@/lib/hooks";
import { useIG } from "@/theme/ig";
import { timeAgo } from "@/lib/time";
import type { Notification } from "@/types/social";

/** Activity — Instagram's notifications feed (likes/follows/comments), SPRINT §4. */
export default function Activity() {
  const c = useIG();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const activity = useActivity();

  const items = useMemo<Notification[]>(
    () => activity.data?.pages.flatMap((p) => p.items) ?? [],
    [activity.data],
  );

  return (
    <View style={[styles.root, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: c.separator }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={c.icon} />
        </Pressable>
        <Text style={[styles.title, { color: c.text }]}>Notifications</Text>
        <View style={{ width: 26 }} />
      </View>

      <FlashList
        data={items}
        keyExtractor={(x) => x.id}
        estimatedItemSize={64}
        onEndReachedThreshold={0.6}
        onEndReached={() => activity.hasNextPage && activity.fetchNextPage()}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Image source={item.actor.avatarUrl} style={styles.avatar} contentFit="cover" />
            <Text style={[styles.text, { color: c.text }]}>
              <Text style={styles.name}>{item.actor.username}</Text>
              <Text> {item.text} </Text>
              <Text style={{ color: c.secondary }}>{timeAgo(item.createdAt)}</Text>
            </Text>

            {item.kind === "follow" ? (
              <Pressable
                style={[
                  styles.followBtn,
                  item.isFollowingActor
                    ? { backgroundColor: c.inputBg }
                    : { backgroundColor: c.link },
                ]}
              >
                <Text style={{ color: item.isFollowingActor ? c.text : "#fff", fontWeight: "600", fontSize: 13 }}>
                  {item.isFollowingActor ? "Following" : "Follow"}
                </Text>
              </Pressable>
            ) : item.postThumbUrl ? (
              <Image source={item.postThumbUrl} style={styles.thumb} contentFit="cover" />
            ) : null}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    height: 44,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 16, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 8 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  text: { flex: 1, fontSize: 14, lineHeight: 19 },
  name: { fontWeight: "600" },
  thumb: { width: 44, height: 44, borderRadius: 4 },
  followBtn: { borderRadius: 8, paddingHorizontal: 16, paddingVertical: 7 },
});
